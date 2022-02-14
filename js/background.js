const { ipcRenderer } = require('electron');
const fs = require('fs');
const xml2js = require('xml2js');
const parser = new xml2js.Parser();

let mainSender = null;

ipcRenderer.on('getGamesFromGameListXml', (event, params) => {    
    mainSender = event.sender;
    getGamesFromGameListXml(params);
});


function getGamesFromGameListXml(params)
{
    let baseUrl = params.baseUrl;
    let games_active = [];
    let games_active_user_def = [];

    /**
    * miramos si tenemos el archivo copia con todos los juegos gamelist.xml.all
    */
    let allGamesFile = null;

    try {
        allGamesFile = fs.readFileSync(baseUrl + '/gamelist.xml.all');
        
        /**
        * parseamos archivo
        */
        parser.parseString(allGamesFile.toString(), (err, result) => {
            if (result) {
                if (result.gameList.game) {

                    let gameId = 1;
                    for (let i = 0; i < result.gameList.game.length; i++) {
                        let game = result.gameList.game[i];
                        /**
                        * asignamos un ID                          
                        */
                        game.gameId = gameId;
                        /**
                        * si tenemos archivo de backup, por defecto empezamos en oculto                        
                        */
                        game.active = false;
                        games_active.push(game);
                        gameId++;                        
                    }
                }
            }
        });        
    }
    catch {
    }


    /**
    * leemos el archivo gamelist.xml
    */
    try {
        let gamelistFile = fs.readFileSync(baseUrl + '/gamelist.xml');

        /**
        * parseamos archivo
        */
        parser.parseString(gamelistFile.toString(), (err, result) => {
            if (result) {

                if (result.gameList.game) {
                    let totalgames = result.gameList.game.length;                    

                    let gameId = 1;
                    for (let i = 0; i < totalgames; i++) {
                        let game = result.gameList.game[i];
                        
                        /**
                        * asignamos un ID
                        */
                        game.gameId = gameId;

                        /**
                        * si no existe fichero de copia, añadimos al array y mostramos en la lista
                        */
                        if (allGamesFile === null) {
                            game.active = true;
                            //TODO en lugar de usar name habrá que usar el nombre del fichero para no duplicar juegos
                            games_active.push(game);                            
                            mainSender.send('insertGameInList', { game: games_active[i], list : 'show'});                            
                        }
                        /**
                        * añadimos a un array temporal para recorrer los juegos visibles
                        */
                        else {
                            games_active_user_def.push(game.name[0]);
                        }
                        gameId++;

                    }
                    /**
                    * Al finalizar el parser, si tenemos copia, ponemos en activo segun los juegos que hay en
                    *  games_active_user_def y mostramos en la lista
                    */
                    if (allGamesFile !== null) {
                        for (let i = 0; i < games_active.length; i++) {
                            let game = games_active[i];
                            if (games_active_user_def.includes(game.name[0])) {
                                games_active[i].active = true;
                                mainSender.send('insertGameInList', { game: games_active[i], list: 'show' });                                
                            }
                            else {                                
                                mainSender.send('insertGameInList', { game: games_active[i], list: 'hidden' });                               
                            }
                        }
                    }
                }
                else {
                    /**
                    * Si no hay ningun juego visible y tenemos juegos en gamelist.xml.all
                    * ponemos la lista de todos los juegos en inactivos
                    */
                    for (let i = 0; i < games_active.length; i++) {
                        let game = games_active[i];                        
                        mainSender.send('insertGameInList', { game: games_active[i], list: 'hidden' });                    
                    }                    
                }
            }
        });
        
    }
    catch {

    }

    /**
    * Finalizado scrape de los gamelist
    */
    mainSender.send('endInsertGameInList', {                
        games_active: games_active
    });
}

