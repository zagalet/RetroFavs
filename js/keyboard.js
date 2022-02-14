window.addEventListener('keydown', shortcuts);

function shortcuts(e) {
    //console.log(e.keyCode);        
    if ( isLoading() )
        return;

    if (modalOpened === true)
        return;
    
    let keys = {
        /* RePag */
        33: () => {
            //TODO retroceder una pagina del listado
           // return selectPreviousGame();
        },
        /* AvPag */
        34: () => {
            //TODO avanzar una pagina del listado
            //return selectNextGame();
        },
        /* flecha izquierda quitamos selecciona de juego actual y cerramos vista detalles */
        37: () => {            
            return selectGame(selected_game_id);
        },
        /* flecha arriba */
        38: () => {
            return selectPreviousGame();
        },
        /* fleach derecha */
        39: () => {
            return selectFirstGame();
        },
        /* fecla abajo */
        40: () => {
            return selectNextGame();
        },
        /* Supr */
        46: () => {
            return showHideAllGames();
        },
        /* A */
        65: () => {
            //anterior plataforma
            return selectPreviousPlatform();
        },
        /* H */
        72: () => {
            return showHideSelectedGame();
        },
        /* I */
        73: () => {
            return showGameList('activos');
        },
        /* O */
        79: () => {
            return showGameList('ocultos');
        },
        /* Z */
        90: () => {
            //siguiente plataforma
            return selectNextPlatform();
        },
        /* S */
        83: () => {
            return saveFiles();
        }
    };

    if (e.keyCode in keys) {
        e.preventDefault();
        keys[e.keyCode]();
    }        

}

function selectNextPlatform() {

    //TODO verificar primero si hay plataformas en la lista
    
    let parent = document.getElementById('platformsList');
    
    /**
    * si no hay plataforma seleccionada, seleccionamos la primera de la lista
     */
    if (selected_platform_name === null) {
    
        selectPlatform(parent.firstChild.id.substring(19));
    }
    /**
    * obtenemos la id de la siguiente plataforma de la lista
    * si estamos en la última, vamos a la primera
     */
    else {

        let childSelected = document.getElementById('item_platform_list_' + selected_platform_name);
        if (childSelected == parent.lastChild)
            selectPlatform(parent.firstChild.id.substring(19));
        else
            selectPlatform(childSelected.nextSibling.id.substring(19));
    }

    adjustScrollPlatformsRangeOfView('next');
}

function selectPreviousPlatform()
{
    //TODO verificar primero si hay plataformas en la lista

    let parent = document.getElementById('platformsList');

    /**
    * si no hay plataforma seleccionada, seleccionamos la ultima de la lista
     */
    if (selected_platform_name === null) {
        selectPlatform(parent.lastChild.id.substring(19));
    }
    /**
    * obtenemos la id de la anterior plataforma de la lista
    * si estamos en la primera, vamos a la ultima
    */
    else {
        let childSelected = document.getElementById('item_platform_list_' + selected_platform_name);
        if (childSelected == parent.firstChild)
            selectPlatform(parent.lastChild.id.substring(19));
        else
            selectPlatform(childSelected.previousSibling.id.substring(19));
    }

    adjustScrollPlatformsRangeOfView('previous');
}

function selectFirstGame() {
    /**
    * Selecciona primer juego si hay plataforma seleccionada
    * pero ningun juego seleccionado aun
    */
    if ((selected_platform_name !== null) && (selected_game_id == null))
        selectNextGame();
}

function showHideSelectedGame() {
    if (selected_game_id !== null) {
        let whatList = actual_list_games_view == 'activos' ? 'hidden' : 'show';        
        moveGameToList(selected_game_id, whatList);
    }
}

function showHideAllGames() {

    if ((selected_platform_name === null) && (actual_list_games_view === null))
        return;

    /**
     * true: enviamos a activos
     * false: enviamos a Hidden
     */
    let status = actual_list_games_view == 'activos' ? false : true;
    let list = actual_list_games_view == 'activos' ? 'gamesList' : 'gamesHidden';

    if (document.getElementById(list).hasChildNodes()) {

        changesToSave();
        games_active.forEach((game, index) => {
            games_active[index].active = status;

            if (status == true) {                
                total_visible_games = games_active.length;
                total_hidden_games = 0;
            }
            else {
                total_visible_games = 0;
                total_hidden_games = games_active.length;
            }
        });

        refreshShowList();
        refreshHiddenList();
        showCountersInTabs();
    }

}

function selectNextGame() {
    if (actual_list_games_view === null)
        return;

    let parentId = actual_list_games_view == 'activos' ? 'gamesList' : 'gamesHidden';
    let parent = document.getElementById(parentId);

    /**
    * si no hay juego seleccionado, seleccionamos el primero de la lista activa
     */
    if (selected_game_id === null) {
        selectGame(parent.firstChild.id.substring(7));
    }
    /**
    * obtenemos la id del siguiente juego de la lista
    * si estamos en el último, vamos al primero
     */
    else {

        let childSelected = document.getElementById('gameId_' + selected_game_id);
        if (childSelected == parent.lastChild)
            selectGame(parent.firstChild.id.substring(7));
        else
            selectGame(childSelected.nextSibling.id.substring(7));
    }

    adjustScrollGamesRangeOfView('next', parent);
}

function selectPreviousGame() {

    if (actual_list_games_view === null)
        return;

    let parentId = actual_list_games_view == 'activos' ? 'gamesList' : 'gamesHidden';
    let parent = document.getElementById(parentId);

    /**
    * si no hay juego seleccionado, seleccionamos el ultimo de la lista activa
     */
    if (selected_game_id === null) {
        selectGame(parent.lastChild.id.substring(7));
    }
    /**
    * obtenemos la id del anterior juego de la lista
    * si estamos en el primero, vamos al ultimo
    */
    else {
        let childSelected = document.getElementById('gameId_' + selected_game_id);
        if (childSelected == parent.firstChild)
            selectGame(parent.lastChild.id.substring(7));
        else
            selectGame(childSelected.previousSibling.id.substring(7));
    }

    adjustScrollGamesRangeOfView('previous', parent);
}

/**
 * movemos el scroll de la lista para mostrar el juevo activo 
 * en el caso de que estemos fuera de los limites visibles
 */
function adjustScrollGamesRangeOfView(direction, glist) {
    const selgame = document.getElementById("gameId_" + selected_game_id);
    /**
     * desplazamiento del scroll de la lista
     */
    let scrollglist = glist.scrollTop;

    /**
     * altura total de una fila con margin y padding
     */
    let heightRow = selgame.clientHeight + parseInt(window.getComputedStyle(selgame).marginBottom);

    /**
    * altura visible de la lista
     */
    let alturaVisibleListado = glist.offsetHeight;

    /**
     * Posicion superior del inicio del area visible de la lista
     */
    let glistBoundTop = glist.getBoundingClientRect().top;

    /**
     * Posicion superior de la fila
     */
    let selgameBoundTop = selgame.getBoundingClientRect().top;

    /**
     * Diferencia de distancia desde la fila al juego seleccionado
     */
    let boundsDiff = selgameBoundTop - glistBoundTop;

    /**
    * Mitad de filas visibles para marcar el centro
     */
    let numRowsToCenter = Math.round((alturaVisibleListado / heightRow) / 2) - 1;

    if ((boundsDiff < 0) || (boundsDiff > (alturaVisibleListado - heightRow))) {
        if (direction == 'next')
            glist.scrollTop = glist.scrollTop + boundsDiff;
        else
            glist.scrollTop = glist.scrollTop + boundsDiff - alturaVisibleListado + (heightRow * 2);
    }

    /**
    * dentro de los limites
    */
    else {
        if (direction == 'next') {
            if ((selgameBoundTop - glistBoundTop) >= (heightRow * numRowsToCenter))
                glist.scrollTop = scrollglist + heightRow;
        }
        else {
            if ((selgameBoundTop - glistBoundTop) < (heightRow * numRowsToCenter))
                glist.scrollTop = scrollglist - heightRow;
        }
    }
}

/**
 * movemos el scroll de la lista para mostrar la plataforma activa
 * en el caso de que estemos fuera de los limites visibles
 */
function adjustScrollPlatformsRangeOfView(direction) {
    
    const selplatform = document.getElementById("item_platform_list_" + selected_platform_name);
    let plist = document.getElementById('platformsList');

    /**
     * desplazamiento del scroll de la lista
     */
    let scrollplist = plist.scrollTop;

    /**
     * altura total de una fila con margin y padding
     */
    let heightRow = selplatform.clientHeight + parseInt(window.getComputedStyle(selplatform).marginBottom);

    /**
    * altura visible de la lista
     */
    let alturaVisibleListado = plist.offsetHeight;

    /**
     * Posicion superior del inicio del area visible de la lista
     */
    let plistBoundTop = plist.getBoundingClientRect().top;

    /**
     * Posicion superior de la fila
     */
    let selplatformBoundTop = selplatform.getBoundingClientRect().top;

    /**
     * Diferencia de distancia desde la fila a la plataforma seleccionada
     */
    let boundsDiff = selplatformBoundTop - plistBoundTop;

    /**
    * Mitad de filas visibles para marcar el centro
     */
    let numRowsToCenter = Math.round((alturaVisibleListado / heightRow) / 2) - 1;

    if ((boundsDiff < 0) || (boundsDiff > (alturaVisibleListado - heightRow))) {
        if (direction == 'next')
            plist.scrollTop = plist.scrollTop + boundsDiff;
        else
            plist.scrollTop = plist.scrollTop + boundsDiff - alturaVisibleListado + (heightRow * 2);
    }

    /**
    * dentro de los limites
    */
    else {
        if (direction == 'next') {
            if ((selplatformBoundTop - plistBoundTop) >= (heightRow * numRowsToCenter))
                plist.scrollTop = scrollplist + heightRow;
        }
        else {
            if ((selplatformBoundTop - plistBoundTop) < (heightRow * numRowsToCenter))
                plist.scrollTop = scrollplist - heightRow;
        }
    }
}