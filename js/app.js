const { ipcRenderer } = require('electron');
const fs = require('fs');
const fsp = require('fs/promises');
const util = require('util');
const xml2js = require('xml2js');
const path = require('path');
const parser = new xml2js.Parser();
const sharp = require('sharp');
const mkdirp = require('mkdirp');
const { setTimeout } = require('timers');

/**
 * importamos info de plataformas
 * */
let platforms = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'platforms.json')));

/**
 * path de la carpeta roms
 */
let romsFolder = null;
let baseUrl = null;

/**
 * lista de juegos encontrados al seleccionar una plataforma
 */
let games_active = [];
let total_visible_games = 0;
let total_hidden_games = 0;

/**
 * plataforma actualmente seleccionada
 */
let selected_platform_name = null;
let total_platforms = 0;
let platform_to_jump_after_save = null;

/**
 * juego actualmente seleccionado
 */
let selected_game_id = null;

/**
 * variable para detectar si se ha realizado algun cambio para guardar
 */
let changes = false;

/**
 * indicamos que listado estamos mostrando
 */
let actual_list_games_view = null;

/**
 * controlamos si estamos cargando la lista de juegos o plataformas
 * para permitir acciones al finalizar
*/
let loading_game_list = false;
let loading_platform_list = false;

/**
 * Detectamos cuando esté abierto el modal para que no se pueda usar el teclado
 */
let modalOpened = false;


function isLoading()
{
    if ((loading_game_list === true) || (loading_platform_list == true))
        return true;
    else
        return false;
}

function setPathCarpetaRoms(path) {       
    
    romsFolder = path;        
    clearPlatformList();
    document.getElementById('input-rom-folder').value = path;
    document.getElementById("countPlatforms").innerHTML = 0;
}

async function checkIfGamelistXmlExist(romsFolder, file)
{        
    /**
    *   miramos si tiene gamelist.xml
    */
    let hayPlataformas = false;

    try {     
        
        await fsp.access(romsFolder + path.sep + file.name + '/gamelist.xml', fs.constants.F_OK, (err) => {     
            if (!err) {                
                
                showPlatformInList(file.name);
                total_platforms++;
                document.getElementById("countPlatforms").innerHTML = total_platforms;
           
                /**
                *   guardamos en local storage la carpeta roms seleccionada previamente
               */
                if (hayPlataformas === false) {                    
                    hayPlataformas = true;
                    localStorage.setItem('romFolder', romsFolder);
                    hidePlatformsListLoading();                    
                }
            }
            else {
                
            }
        });        
        
    }
    catch (error) {

    }    
}




async function getFolderRoms(fromPrevSession = null) {            

    showPlatformsListLoading();

    try {
        const files = await fsp.readdir(romsFolder, { withFileTypes: true });
        total_platforms = 0;
        
        document.getElementById('platformsSection').classList.remove('hidden');
        showPlatformsListLoading();
        
        
        for (const file of files) {                        
            if (file.isDirectory()) {                
             checkIfGamelistXmlExist(romsFolder, file);
            }
        }
                
    } catch (error) {                

        if (prevSessionFolder !== null) {
            romsFolder = null;
            localStorage.removeItem('romFolder');
            document.getElementById('input-rom-folder').value = '';
        }
    }    
}

function selectGame(gameId)
{
    if ( isLoading() )
        return;
    
    highlightGameOff();
    selected_game_id = selected_game_id == gameId ? null : gameId;
    highlightGameOn();
}

async function leerGameList(romPlatformFolder) {        

    baseUrl = romsFolder + path.sep + romPlatformFolder;     
    
    games_active = [];
    games_active_user_def = [];
    selected_game_id = null;
    showGameList('activos');

    document.getElementById("gamesList").innerHTML = '';
    document.getElementById("gamesHidden").innerHTML = '';
    resetChangesToSave();
    resetCounters();
        
    try {        
       document.getElementById("platformName").innerHTML = platforms[romPlatformFolder].name;        
    }
    catch (error) {
        document.getElementById("platformName").innerHTML = romPlatformFolder;        
    }
    
    showTabsGameList();
    

    loading_list_games = true;

    let params = {
        'baseUrl': baseUrl
    }
    ipcRenderer.send('getGamesFromGameListXml', params);



    return;   
    showCountersInTabs();
    hideGamesListLoading();

}

ipcRenderer.on('insertGameInList', (event, params) => {            
    insertGameInList(params.game, params.list);
    if (params.game.active === true)
        total_visible_games++;
    else if (params.game.active === false)
        total_hidden_games++;
    
    showCountersInTabs();
});

ipcRenderer.on('endInsertGameInList', (event, params) => {      
    games_active = params.games_active;
    showCountersInTabs();
    hideGamesListLoading();
});

async function insertGameInList(game, whatList) {
    let listId = "gamesList";
    let btnLabel = "Hide";
    let btnStyle = "btn-danger";
    let moveTo = "hidden";

    if (whatList === "hidden") {
        listId = "gamesHidden";        
        btnLabel = "Show";
        btnStyle = "btn-success";
        moveTo = "show";
    }
    let gameListBox = document.getElementById(listId);
    
    let html = htmlListBoxGame(game, moveTo);
  
    gameListBox.insertAdjacentHTML('beforeend', html);
    return;
    //TODO esta parte tiene que hacerse en background
    /**
    * cargamos la imagen de forma asincrona
    */
    try {
        if (game.image[0]) {
            let image = hasDotSlash(game.image[0]) ? removeDotSlash(game.image[0]) : game.image[0];
            let imageName = path.basename(image);
            let imgCache = './img-cache/' + selected_platform_name + '/';

            /**
            * verifica existe carpeta de plataforma en caché, sinó la crea
            */
            await mkdirp(imgCache);

            /**
            * verificar si existe miniatura antes de crearla
            */
            await fsp.access(imgCache + imageName, fs.constants.F_OK, (err) => {
                if (err) {
                    sharp(baseUrl + image)
                        .resize(40, 30)
                        .toFile(imgCache + imageName, (e) => {
                            if (!(e) && document.getElementById('gameId_' + game.gameId)) {
                                document.getElementById('gameId_' + game.gameId).getElementsByClassName('img-thumbnail')[0].setAttribute('src', imgCache + imageName);
                            }
                        });
                } else {
                    document.getElementById('gameId_' + game.gameId).getElementsByClassName('img-thumbnail')[0].setAttribute('src', imgCache + imageName);
                }
            });
        }
    }
    catch { }
}


function moveGameToList(gameId, whatList) {
   
    if (isLoading())
        return;
    
    let status = true;
    if (whatList === 'hidden')
        status = false;
    
    changesToSave();

    let gameItemList = document.getElementById("gameId_" + gameId);
    
    if (gameItemList.nextSibling)
    {        
        selectGame(gameItemList.nextSibling.id.substring(7));
    }
    else if ((gameItemList.parentNode.firstChild) && (gameItemList.parentNode.firstChild.id.substring(7) !== selected_game_id) )
    {
        selectGame(gameItemList.parentNode.firstChild.id.substring(7));     
    }
    else {        
        selectGame(selected_game_id);        
    }
    
    gameItemList.remove();

    games_active.forEach((game, index) => {        
        if (game.gameId == gameId) {
            games_active[index].active = status;
            if (status == true){
                refreshShowList();
                incVisibleCounter();                              
            }
            else {
                incHiddenCounter();
                refreshHiddenList();
            }
            showCountersInTabs();
        }
    });    
    
}

function showConfirmSaveContinueModal()
{
    modalOpened = true;
    document.getElementById("modal").classList.remove('hidden');
}

function closeModalAndContinue() {    
    resetChangesToSave();
    document.getElementById("modal").classList.add('hidden');
    selectPlatform(platform_to_jump_after_save);
    modalOpened = false;
}

function closeModalAfterSave() {        
    resetChangesToSave();
    document.getElementById("modal").classList.add('hidden');
    selectPlatform(platform_to_jump_after_save);
    modalOpened = false;    
}

function selectPlatform(romSelected)
{    
    /**
    *   verificar si hay cambios para guardar antes de cambiar de plataforma
    */
    if (changes === true) {

        platform_to_jump_after_save = romSelected;
        /* mostramos modal de confirmacion */
        showConfirmSaveContinueModal();
        return;
    }
    
    selected_platform_name = romSelected;
    platform_to_jump_after_save = null;

    document.getElementById("gameListInfo").classList.add("hidden");
    showGamesListLoading()    
    let glist = document.getElementById("gamesList");
    glist.classList.remove("hidden");
    glist.scrollTop = 0;

    closeBoxDetailGame();
    
    Array.from(document.getElementsByClassName("item_platform_list_element"))
        .forEach((el) => {
        el.classList.remove("bg-indigo-500", "hover:bg-indigo-600");
    });
    document.getElementById("item_platform_list_" + romSelected).classList.add("bg-indigo-500","hover:bg-indigo-600");        
    
    leerGameList(romSelected);
    
}

function changesToSave()
{    
    changes = true;
    document.getElementById('btn-save').classList.remove("hidden");

}

function resetChangesToSave()
{    
    changes = false;    
    document.getElementById('btn-save').classList.add("hidden");
}

async function saveFiles()
{    
    try {
        /**
        * creamos copia si no existe
        */
        await backupFile();

        /**
        * reescribimos gamelist.xml con los juegos seleccionados
        */
        await writeGamesToXml();
    }
    catch (e){
        
    }       

    resetChangesToSave();
}

async function writeGamesToXml() {
    let games_to_write = [];
    /*
    * creamos duplicado del objeto para no modificar el actual 
    */
    let temp_games_active = JSON.parse(JSON.stringify(games_active));    

    temp_games_active.forEach((gametowrite, index) => {
        if (gametowrite.active === true) {
            delete gametowrite.active;
            delete gametowrite.gameId;
            games_to_write.push(gametowrite);
        }
    });
    
    let gamelist = {
        gameList: {
            provider: {
                System: selected_platform_name,
                software: 'Nombre de la aplicación',
                web: 'url de GIT'
            },
            game: games_to_write
        }    
    };
    let builder = new xml2js.Builder();
    let xml = builder.buildObject(gamelist);    
    
    try {        
        await fsp.writeFile(baseUrl + '/gamelist.xml', xml);        
            temp_games_active = null;
            if (modalOpened === true) {
                closeModalAfterSave();
            }
    }
    catch (e) {        
        temp_games_active = null;        
        if (modalOpened === true) {
            closeModalAfterSave();
        }
    }    

    
    
}

async function backupFile()
{
    try {
        await fsp.copyFile(baseUrl + '/gamelist.xml', baseUrl + '/gamelist.xml.all', fs.constants.COPYFILE_EXCL);        
    }
    catch (e) {        
    }
}

function hasDotSlash(path)
{
    return /^\.\//.test(path); 
}

function removeDotSlash(path,offset = 1)
{    
    return path.substring(offset);
}


function openInfo(gameId) {
    
    let gameInfo = null;
    let params = {
        name: null,
        path: null,
        desc : null,
        rating : null,
        releasedate : null,
        genre : null,
        players : null,
        image : null,
        marquee : null,
        video : null
    };

    const videoPlayer = document.getElementById("detailVideo");
    const videoPlayerSource = document.getElementById("detailVideoSource");

    
    
    games_active.some((game, index) => {        
        if (game.gameId == gameId) {            
            gameInfo = game;           
            return true;
        }
        else {
    
        }
    });

    
        
    document.getElementById('detailImg').parentNode.classList.add('hidden');
    document.getElementById('detailVideo').parentNode.classList.add('hidden');
    if (videoPlayer.currentSrc != '')
        videoPlayer.pause();
    
    
    document.getElementById('detailDesc').parentNode.classList.add('hidden');
    document.getElementById('detailDate').parentNode.classList.add('hidden');
    document.getElementById('detailGenre').parentNode.classList.add('hidden');
    document.getElementById('detailPlayers').parentNode.classList.add('hidden');
    
    if (gameInfo.name)
        params.name = gameInfo.name;
    if (gameInfo.path) {
        params.path = hasDotSlash(gameInfo.path[0]) ? removeDotSlash(gameInfo.path[0],2) : gameInfo.path[0];        
    }
    if (gameInfo.desc) {        
        params.desc = gameInfo.desc;
        document.getElementById('detailDesc').parentNode.classList.remove('hidden');
    }   
    if (gameInfo.releasedate) {
        let fecha = gameInfo.releasedate.toString();        
        params.releasedate = fecha.substring(6, 8) + '/'
            + fecha.substring(4, 6) + '/' + fecha.substring(0, 4);
        document.getElementById('detailDate').parentNode.classList.remove('hidden');
    }
    if (gameInfo.genre) {
        params.genre = gameInfo.genre;
        document.getElementById('detailGenre').parentNode.classList.remove('hidden');
    }
    if (gameInfo.players) {
        params.players = gameInfo.players;           
        document.getElementById('detailPlayers').parentNode.classList.remove('hidden');
    }
    
    document.getElementById('detailTitle').innerHTML = params.name;
    document.getElementById('detailDesc').innerHTML = params.desc;
    document.getElementById('detailDate').innerHTML = params.releasedate;
    document.getElementById('detailGenre').innerHTML = params.genre;    
    document.getElementById('detailPlayers').innerHTML = params.players;
    document.getElementById('detailPath').innerHTML = params.path;
    

    if (gameInfo.image) {
        let image = hasDotSlash(gameInfo.image[0]) ? removeDotSlash(gameInfo.image[0]) : gameInfo.image[0];
        params.image = baseUrl + image;
        try {            
             fs.access(params.image, fs.constants.F_OK, (err) => {                 
                 if (!err) {                    
                     document.getElementById('detailImg').parentNode.classList.remove('hidden');
                    document.getElementById('detailImg').setAttribute('src', escape(params.image));                    
                }                
            });            
        }
        catch {            
        }
    }
    
    if (gameInfo.video) {
        
        let video = hasDotSlash(gameInfo.video[0]) ? removeDotSlash(gameInfo.video[0]) : gameInfo.video[0];
        params.video = baseUrl + video;
        try {
             fs.access(params.video, fs.constants.F_OK, (err) => {
                if (!err) {               
     
                    videoPlayer.setAttribute("style", `top: 0; left: 0; width: 100%;`);
                    videoPlayerSource.setAttribute("src", escape(params.video));
                    videoPlayer.load();
                    try {
                        let PromiseVideo = videoPlayer.play();
                    }
                    catch {
                    }
                    document.getElementById('detailVideo').parentNode.classList.remove('hidden');
                }
                
            });
        }
        catch {
            
        }
        
    }

    //let alto = document.getElementById('boxDetailGameContent').height;
    //TODO console.log('alto',alto);
    
    
}

const selectDirBtn = document.getElementById('select-file');


selectDirBtn.addEventListener('click', function (event) {
    ipcRenderer.send('open-directory-dialog')
});



/**
* Comprobamos si tenemos guardada una ruta previa
*/
if (prevSessionFolder = localStorage.getItem('romFolder')) {
    
    setPathCarpetaRoms(prevSessionFolder);
    getFolderRoms(prevSessionFolder);
}

/**
* Getting back the information after selecting the file
*/
ipcRenderer.on('selected-directory', function (event, path) {      

    /**
    * Solicitamos la ruta de la carpeta roms
    * posibilidad de guardar la sesión anterior en local storage
    */
    setPathCarpetaRoms(path);

    /**
    * Con la ruta obtenida mirariamos si hay carpetas de plataformas con el archivo xml
    */
    getFolderRoms();

});


//TODO cambiar scroll al pasar de la lista de arriba a abajo o cambiar de listado
// o al ocultar ultima fila y saltamos a primera fila
