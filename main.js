const { app, screen, BrowserWindow, dialog, ipcMain } = require('electron');

let ventanaPrincipal = null;
let ventanaConfirm = null;
let ventanaConfirmOptions;
let ventanaConfirmAnswer;
let windowBackgroundProcess = null;

let widthScreen, heightScreen = null;

function crearVentanaPrincipal()
{
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    widthScreen = width;
    heightScreen = height;

    ventanaPrincipal = new BrowserWindow({
        width: widthScreen,
        height: heightScreen,
        useContentSize: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            nodeIntegrationInWorker: true
        }
    });

    ventanaPrincipal.loadFile('index.html');   
}

app.whenReady()
    .then(crearVentanaPrincipal)
    .then(crearWindowBackgroundProcess);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().lenght === 0) {
        crearVentanaPrincipal();        
    }
})

ipcMain.on('open-directory-dialog', (event) => {

    dialog.showOpenDialog(
        ventanaPrincipal,
        {
            title: 'Selecciona carpeta roms',
            buttonLabel: 'Seleccionar esta carpeta',
            properties: ['openDirectory']
        }).then(result => {            
            if ( (result.canceled === false) && (result.filePaths.length > 0))
            {
                event.sender.send('selected-directory', result.filePaths[0]);
            }
        }).catch(err => {
            console.log(err);
        })    
});

function crearVentanaConfirm(parent, options, callback) { 
    ventanaConfirmOptions = options;
    ventanaConfirm = new BrowserWindow({
        parent: parent,
        modal: true,
        show: false,
        alwaysOnTop: true,
        width: 400,
        height: 250,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
        },
    );
    ventanaConfirm.on('closed', () => { 
        ventanaConfirm = null;
        callback(ventanaConfirmAnswer);
    })

    ventanaConfirm.loadFile('alert.html');
  //  ventanaConfirm.setMenu(null);
    ventanaConfirm.once('ready-to-show', () => {
        ventanaConfirm.show();
    });
}

ipcMain.on('confirm', (event) => {
    crearVentanaConfirm(ventanaPrincipal, {
        'title' : 'Atención'
    },
    function (data) {
        event.returnValue = data
    }
    );
   
});
ipcMain.on('open-confirm', (event, data) => { 
    event.returnValue = JSON.stringify(ventanaConfirmOptions, null, '');
})

ipcMain.on('close-confirm', (event, data) => {
    ventanaConfirmAnswer = data;    
});



function crearWindowBackgroundProcess() {
    windowBackgroundProcess = new BrowserWindow({
        show: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });
    windowBackgroundProcess.loadFile('background_process.html');
}

/**
 * Lectura de GameListXml en background
 */
ipcMain.on('getGamesFromGameListXml', (event, params) => {
    windowBackgroundProcess.webContents.send('getGamesFromGameListXml', params);
});

ipcMain.on('insertGameInList', (event, params) => {
    ventanaPrincipal.webContents.send('insertGameInList', params);
});

ipcMain.on('endInsertGameInList', (event, params) => {
    ventanaPrincipal.webContents.send('endInsertGameInList', params);
});