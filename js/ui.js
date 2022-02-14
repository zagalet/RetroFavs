function showGameList(whatList) {
    
    if ( isLoading() )
        return;

    actual_list_games_view = whatList;
    
    let btnShow = document.getElementById('btnShowList');
    let btnHide = document.getElementById('btnHideList');
    let listActive = document.getElementById('gamesList');
    let listHidden = document.getElementById('gamesHidden');

    if (whatList == 'activos')
    {
        btnShow.classList.replace("bg-gray-800", "bg-indigo-500");
        btnShow.classList.replace("hover:bg-gray-600", "hover:bg-indigo-600");
        btnHide.classList.replace("bg-indigo-500", "bg-gray-800");
        btnHide.classList.replace("hover:bg-indigo-600", "hover:bg-gray-600");

        listHidden.classList.add("hidden");
        listActive.classList.remove("hidden");
    }
    else {
        btnHide.classList.replace("bg-gray-800", "bg-indigo-500");
        btnHide.classList.replace("hover:bg-gray-600", "hover:bg-indigo-600");
        btnShow.classList.replace("bg-indigo-500", "bg-gray-800");
        btnShow.classList.replace("hover:bg-indigo-600", "hover:bg-gray-600");

        listActive.classList.add("hidden");
        listHidden.classList.remove("hidden");
    }

    selectGame(selected_game_id);
}

function showPlatformInList(platform) {

    let styleRow = "bg-black";
    if ((document.getElementById('platformsList').childNodes.length % 2) === 1)
        styleRow = "";

    html = '<div id="item_platform_list_' + platform + '" class="item_platform_list_element flex p-4 ' + styleRow + ' hover:bg-gray-800 rounded" onclick="selectPlatform(\'' + platform + '\')">';
    html += '<span class="inline-flex w-8 h-8 mr-2 justify-center items-center">';    
    html += '<img class="h-9" src="./img/controlers/' + platform + '.svg">';
    html += '</span>';
    html += '<div class="text-lg">';
    html += '<p class="font-medium">' + platforms[platform].name + '</p>';
    html += '</div>';
    html += '</div>';

    document.getElementById('platformsList').insertAdjacentHTML('beforeend', html)
}


function clearPlatformList() {
    let listActive = document.getElementById('gamesList');
    let listHidden = document.getElementById('gamesHidden');    

    document.getElementById('platformsList').innerHTML = '';
    document.getElementById('gamesList').innerHTML = '';
    document.getElementById('gamesHidden').innerHTML = '';
    document.getElementById('platformsSection').classList.add('hidden');
    

    hideTabsGameList()
    listActive.classList.add("hidden");
    listHidden.classList.add("hidden");
    closeBoxDetailGame();
}

function htmlListBoxGame(game, moveTo)
{
    let textButton = moveTo == 'hidden' ? 'Ocultar' : 'Mostrar';

    let html = '<div  id="gameId_' + game.gameId + '" class="pl-4 pr-6 py-1 mb-1 bg-gray-900 hover:bg-black text-gray-200 shadow rounded group transition-all duration-200">';
    html += '<div class="flex flex-wrap items-center -mx-4">';
    html += '<div onclick="selectGame(' + game.gameId + ')" class="w-full md:w-5/6 mb-4 md:mb-0 px-4 flex items-center">';
    html += '<img id="imgGame_' + game.gameId + '" class="img-thumbnail mr-3 h-6" src="./img/noimageth.png" alt="">';
    html += '<h4 class="text-lg font-medium overflow-hidden h-7">' + game.name[0] + '</h4>';
    html += '</div>';    
    html += '<div class="w-auto md:w-1/6 px-4 my-1 text-right">';
    html += '<button onclick="moveGameToList(' + game.gameId + ',\'' + moveTo + '\')" class="opacity-0 z-50 group-hover:opacity-100 items-center py-2 px-4 mr-3 bg-indigo-500 hover:bg-indigo-600 rounded text-xs text-white ">' + textButton+'</button>';
    html += '</div>';
    html += '</div>';
    html += '</div>';
    return html;
}

function resetCounters() {
    total_visible_games = 0;
    total_hidden_games = 0;
}

function incVisibleCounter() {
    total_visible_games++;
    total_hidden_games--;
}

function incHiddenCounter() {
    total_visible_games--;
    total_hidden_games++;
}

function showCountersInTabs() {
    document.getElementById('btnShowList').text = 'Visibles ' + total_visible_games;
    document.getElementById('btnHideList').text = 'Ocultos ' + total_hidden_games;
}

function refreshHiddenList() {
    document.getElementById("gamesHidden").innerHTML = '';
    games_active.forEach((game) => {
        if (game.active === false)
            insertGameInList(game, 'hidden');
    });
}

function refreshShowList() {
    document.getElementById("gamesList").innerHTML = '';
    games_active.forEach((game) => {
        if (game.active === true)
            insertGameInList(game, 'show');
    });
}

/**
 * resalta la fila del juego seleccionado
 */
function highlightGameOn()
{
    if (selected_game_id !== null) {
        let row = document.getElementById("gameId_" + selected_game_id);
        row.classList.replace("bg-gray-900", "bg-indigo-500");
        row.classList.replace("hover:bg-black", "hover:bg-indigo-600");

        /**
        * cargamos los datos del juego en la caja de detalle
        */
        openInfo(selected_game_id);
        /**
        * mostramos bloque detalle del juego si no estuviera abierto antes
        */
        openBoxDetailGame();
    }
    else {
     /**
     * cerramos bloque detalle del juego
     */
        closeBoxDetailGame();        
    }
}

/**
 * quita el resaltado del juego seleccionado
 */
function highlightGameOff()
{
    if (selected_game_id !== null)
    {
        let row = document.getElementById("gameId_" +selected_game_id);
        row.classList.replace("bg-indigo-500","bg-gray-900");
        row.classList.replace("hover:bg-indigo-600","hover:bg-black");
    }
}

function openBoxDetailGame() {
    let boxDetail = document.getElementById("boxDetailGame");
    if (boxDetail.classList.contains("hidden"))
    {
        const boxList = document.getElementById("boxListGames");
        boxList.classList.replace("md:w-3/3", "md:w-2/3");
        boxDetail.classList.remove("hidden");        
    }
}

function closeBoxDetailGame() {
    const boxDetail = document.getElementById("boxDetailGame");
    const videoPlayer = document.getElementById("detailVideo");

    if (!boxDetail.classList.contains("hidden"))
    {
        let boxList = document.getElementById("boxListGames");
        boxList.classList.replace("md:w-2/3", "md:w-3/3");
        boxDetail.classList.add("hidden");
    }

    if (videoPlayer.currentSrc != '')
        videoPlayer.pause();
}

function showPlatformsListLoading() {
    loading_platform_list = true;
    document.getElementById("platformListLoading").classList.remove("hidden");
}

function hidePlatformsListLoading() {
    loading_platform_list = false;
    document.getElementById("platformListLoading").classList.add("hidden");
}

function showGamesListLoading()
{
    loading_list_games = true;
    document.getElementById("gameListLoading").classList.remove("hidden");
}

function hideGamesListLoading() {
    loading_list_games = false;
    document.getElementById("gameListLoading").classList.add("hidden");
}

function showTabsGameList() {
    document.getElementById("tabsGamesList").classList.remove("hidden");
}

function hideTabsGameList() {
    document.getElementById("tabsGamesList").classList.add("hidden");
}