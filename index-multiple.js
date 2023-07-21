const {
    Client,
    MessageMedia,
    LocalAuth,
    MessageType,
    Buttons,
    List
} = require('whatsapp-web.js');
const {phoneNumberFormatter} = require('./helpers/formatter');
const express = require('express');
const socketIO = require('socket.io');
const qrcode = require('qrcode');
const http = require('http');
const https = require('https');
const fs = require('fs');
const request = require('request');
const axios = require('axios');
const port = process.env.PORT || 6000;
const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true,
        transports: ['websocket', 'polling'],
    },
    allowEIO3: true
});


app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));

app.get('/', (req, res) => {
    res.sendFile('index-multiple.html', {
        root: __dirname
    });
});

const sessions = './whatsapp-sessions.json';
const sessions_aktif = [];
const createSessionsFileIfNotExists = function() {
  if (!fs.existsSync(sessions)) {
    try {
      fs.writeFileSync(sessions, JSON.stringify([]));
      console.log('Sessions file created successfully.');
    } catch(err) {
      console.log('Failed to create sessions file: ', err);
    }
  }
}
createSessionsFileIfNotExists()
const getSessionsFile = function() {
  return JSON.parse(fs.readFileSync(sessions));
}




const createSession = function(id, description) {
    console.log('Creating session: ' + id);


    const client = new Client({
        restartOnAuthFail: true,
        puppeteer: {
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--single-process', // <- this one doesn't works in Windows
                '--disable-gpu'
            ],
        },
        authStrategy: new LocalAuth({
            clientId: id
        })
    });

    client.initialize();


    client.on('message', async msg => {

        if (msg.body == '!ping') {
            msg.reply('pong');
        } else if (msg.body == 'good morning') {
            msg.reply('selamat pagi');
        } else if (msg.body == "!absen gaes") {
            msg.reply('Hadir , Bot Active');
        } else if (msg.body == "!list") {
          let sections = [{title:'sectionTitle',rows:[{title:'ListItem1', description: 'desc'},{title:'ListItem2'}]}];
    let list = new List('List body','btnText',sections,'Title','footer');
    client.sendMessage(msg.from, list);
        } else if (msg.body == '!groups') {
            client.getChats().then(chats => {
                const groups = chats.filter(chat => chat.isGroup);

                if (groups.length == 0) {
                    msg.reply('You have no group yet.');
                } else {
                    let replyMsg = '*YOUR GROUPS*\n\n';
                    groups.forEach((group, i) => {
                        replyMsg += `ID: ${group.id._serialized}\nName: ${group.name}\n\n`;
                    });
                    replyMsg += '_You can use the group id to send a message to the group._'
                    msg.reply(replyMsg);
                }
            });
        }
    });




    client.on('qr', (qr) => {

        const savedSessions = getSessionsFile();
        const sessionIndex = savedSessions.findIndex(sess => sess.id == id);

        if (!savedSessions[sessionIndex]) {
            // console.log(`${id} Ready False`);
        } else {


            // setSessionsFile(savedSessions);
            // console.log('QR RECEIVED', qr);
            qrcode.toDataURL(qr, (err, url) => {
                var dataqr = [
                    [url, id]
                ];
                io.emit('qr', {
                    id: id,
                    src: url
                });
                io.emit('message', {
                    id: id,
                    text: 'QR Code received, scan please!'
                });
            });
        }
    });

    client.on('ready', () => {

        io.emit('ready', {
            id: id
        });

        io.emit('message', {
            id: id,
            text: 'Whatsapp is ready!'
        });

        const savedSessions = getSessionsFile();
        const sessionIndex = savedSessions.findIndex(sess => sess.id == id);

        if (!savedSessions[sessionIndex]) {
            console.log(`${id} Ready False`);
        } else {
            savedSessions[sessionIndex].ready = true;
            const updqr = `UPDATE users SET ready = 1 WHERE id = '${id}'`;
            connection.query(updqr, function(err, result) {
              if (err) {
                console.log('Not Connected');
              } else {
                console.log(`Update ${id}`);

              }
          });
              // setSessionsFile(savedSessions);
        }

        console.log(`Client ${id} is ready!`);
        const number = "+6289510353409";
        const text = `Device "${id}" ready`;
        const chatId = number.substring(1) + "@c.us";
        // Sending message.
          client.sendMessage(chatId, text);

      //Info Client.
        let info = client.info;



    });



    //Data Pending Admin
    client.on('message', msg => {

        if (msg.to == '6288291962387@c.us') {
            if (msg.body == '!DataPending') {
                msg.reply("Oke Tunggu Bos !");
                request({
                    url: 'https://pertalis.com/it/api_ticket.php?key=LabPertamaAPI2020_Form',
                    json: true
                }, function(err, res, json) {
                    if (err) {
                        msg.reply("API Node Js Error Bos !");
                        console.log("error");
                        console.log(err);
                    } else {
                        console.log(json);
                        let leng = json.result.length;
                        // console.log(leng);
                        var respon = '';
                        for (var i = 0; i < leng; i++) {
                            var user = json.result[i].user;
                            var isi = json.result[i].isi;
                            var file = json.result[i].file;
                            var all = json.result[i];
                            respon = respon + JSON.stringify(all) + "\n \n \n";
                        }
                        if (respon == "") {
                            msg.reply("Sudah Tidak Ada Yang Pending Bos :) ");
                        } else {
                            msg.reply(respon);
                        }
                    }
                });
            } else {
                const balesan = msg.body.split('#');
                if (balesan[0] == "*") {
                    var id = balesan[1];
                    var balas = balesan[2];
                    console.log(balas);
                    request({
                        url: 'https://pertalis.com/it/api_action.php?id=' + id + '&balas=' + balas,
                        json: true
                    }, function(err, res, json) {
                        if (err) {
                            msg.reply("API Node Js Error Bos !");
                            console.log("error");
                        } else {
                            console.log(json.result);
                            msg.reply(json.result);
                        }
                    });
                }
            }
        } else {
            return false;
        }
    });

    client.on('authenticated', () => {
        io.emit('authenticated', {
            id: id
        });
        io.emit('message', {
            id: id,
            text: 'Whatsapp is authenticated!'
        });
    });

    client.on('auth_failure', function() {
        io.emit('message', {
            id: id,
            text: 'Auth failure, restarting...'
        });
    });

    client.on('disconnected', (reason) => {
        io.emit('message', {
            id: id,
            text: 'Whatsapp is disconnected!'
        });
        client.destroy();
        client.initialize();

        // Menghapus pada file sessions
        const savedSessions = getSessionsFile();
        const sessionIndex = savedSessions.findIndex(sess => sess.id == id);
        savedSessions.splice(sessionIndex, 1);
        // setSessionsFile(savedSessions);

        console.log(`User ${id} disconnected`);
        io.emit('remove-session', id);
    });

    // Tambahkan client ke sessions
    sessions_aktif.push({
        id: id,
        description: description,
        client: client
    });

    // Menambahkan session ke file
    const savedSessions = getSessionsFile();
    const sessionIndex = savedSessions.findIndex(sess => sess.id == id);

    if (sessionIndex == -1) {
        savedSessions.push({
            id: id,
            description: description,
            ready: false,
        });
        // setSessionsFile(savedSessions);
    }
}

const init = function(socket) {
    const savedSessions = getSessionsFile();
    console.log(savedSessions);
    if (savedSessions.length > 0) {
        if (socket) {
            socket.emit('init', savedSessions);
        } else {
            savedSessions.forEach(sess => {
                createSession(sess.id, sess.description);
            });
        }
    }
}

init();
//     const clientx = sessions_aktif.find(sess => sess.id == '003').client;
// console.log(clientx);
// Socket IO
io.on('connection', function(socket) {
    init(socket);

    socket.on('create-session', function(data) {
        console.log('Create session: ' + data.id);
        createSession(data.id, data.description);
    });
});

// Send message
app.post('/send-message', (req, res) => {
    const sender = req.body.sender;
    const number = phoneNumberFormatter(req.body.number);
    const message = req.body.message;
    const chatId = number.substring(1) + "@c.us";
    // const savedSessions = getSessionsFile();
    const client = sessions_aktif.find(sess => sess.id == sender).client;
    // console.log(savedSessions);
    client.sendMessage(number, message).then(response => {
        res.status(200).json({
            status: true,
            response: response
        });
    }).catch(err => {
        res.status(500).json({
            status: false,
            response: err
        });
    });
});


//send broadcast
app.post('/send-broadcast', async (req, res) => {
    const sender = req.body.sender;
    if (!sender) {
        res.status(404).json({
            status: false,
            response: "Not Number"
        });
    }
    const url = req.body.url;
    const message = req.body.message;
    let nomor = req.body.number;
    const listnomor = nomor.split(',');
    // const savedSessions = getSessionsFile();
    const client = sessions_aktif.find(sess => sess.id == sender).client;
      // console.log(client);
    if (!client) {
        return res.status(422).json({
            status: false,
            message: `The sender: ${sender} is not found!`
        });
    }

    let respon = [];
    let users = [];
    for (let i = 0; i < listnomor.length; i++) {
        const number = phoneNumberFormatter(listnomor[i]);
        const chatId = number.substring(1) + "@c.us";
        // const savedSessions = getSessionsFile();

        respon.push(client.sendMessage(number, message).then(response => {
            users.push(response);
        }).catch(err => {
            users.push(err);

        }));
    }

    Promise.all(respon).then(() => {
        res.json({
            status: true,
            response: users
        });
    });

});


// Send group media
app.post('/send-group', async (req, res) => {
    const sender = req.body.sender;
    const namagrup = req.body.namagrup;
    const message = req.body.message;
    const url = req.body.urlimg;
    // const savedSessions = getSessionsFile();
    const client = sessions_aktif.find(sess => sess.id == sender).client;
      // console.log(client);
    client.getChats().then(async (chats) => {
        const group = chats.find((chat) => chat.name === namagrup);
        let mimetype;
        const attachment = await axios.get(url, {
            responseType: 'arraybuffer'
        }).then(response => {
            mimetype = response.headers['content-type'];
            return response.data.toString('base64');
        });
        const media = new MessageMedia(mimetype, attachment, 'Media');
        // const mediaUrl = await MessageMedia.fromUrl(url);
        group.sendMessage(media, {
            caption: message
        }).then(response => {
            res.status(200).json({
                status: true,
                response: response
            });
        }).catch(err => {
            res.status(500).json({
                status: false,
                response: err
            });
        });
    });

});

//send group msg
app.post('/send-group-msg', async (req, res) => {
    const sender = req.body.sender;
    const namagrup = req.body.namagrup;
    const message = req.body.message;
    // const savedSessions = getSessionsFile();
    const client = sessions_aktif.find(sess => sess.id == sender).client;
    client.getChats().then(async (chats) => {
        const group = chats.find((chat) => chat.name === namagrup);
        group.sendMessage(message).then(response => {
            res.status(200).json({
                status: true,
                response: response
            });
        }).catch(err => {
            res.status(500).json({
                status: false,
                response: err
            });
        });
    });

});


//send media mult number
app.post('/send-media', async (req, res) => {

    const sender = req.body.sender;
    if (!sender) {
        res.status(404).json({
            status: false,
            response: "Not Number"
        });
    }
    const url = req.body.url;
    const caption = req.body.caption;
    let nomor = req.body.number;
    const listnomor = nomor.split(',');
    const client = sessions_aktif.find(sess => sess.id == sender).client;
    if (client === undefined) {
        return res.status(422).json({
            status: false,
            message: `The sender: ${sender} is not found!`
        });
    }

    let respon = [];
    let users = [];
    for (let i = 0; i < listnomor.length; i++) {
        const number = phoneNumberFormatter(listnomor[i]);
        const chatId = number.substring(1) + "@c.us";
        // const savedSessions = getSessionsFile();
        // let options = { mimetype: 'image/png' , caption: caption};
        //  const mediaUrl = await MessageMedia.fromUrl (url);
        let mimetype;
        const attachment = await axios.get(url, {
            responseType: 'arraybuffer'
        }).then(response => {
            mimetype = response.headers['content-type'];
            return response.data.toString('base64');
        });
        const media = new MessageMedia(mimetype, attachment, 'Media');

        respon.push(client.sendMessage(number, media, {
            caption: caption
        }).then(response => {
            users.push(response);
        }).catch(err => {
            users.push(err);

        }));
    }

    Promise.all(respon).then(() => {
        res.json({
            status: true,
            response: users
        });
    });

});


//send File mult number
app.post('/send-file', async (req, res) => {
    const sender = req.body.sender;
    if (!sender) {
        res.status(404).json({
            status: false,
            response: "Not Number"
        });
    }
    const url = req.body.url;
    const caption = req.body.caption;
    let nomor = req.body.number;
    const listnomor = nomor.split(',');
      // const savedSessions = getSessionsFile();
    const client = sessions_aktif.find(sess => sess.id == sender).client;
    if (!client) {
        return res.status(422).json({
            status: false,
            message: `The sender: ${sender} is not found!`
        });
    }

    let respon = [];
    let users = [];
    for (let i = 0; i < listnomor.length; i++) {
        const number = phoneNumberFormatter(listnomor[i]);
        const chatId = number.substring(1) + "@c.us";
        // const savedSessions = getSessionsFile();
        // let options = { mimetype: 'image/png' , caption: caption};
        //  const mediaUrl = await MessageMedia.fromUrl (url);
        let mimetype;
        const attachment = await axios.get(url, {
            responseType: 'arraybuffer'
        }).then(response => {
            mimetype = response.headers['content-type'];
            return response.data.toString('base64');
        });
        const media = new MessageMedia(mimetype, attachment, 'Media');

        respon.push(client.sendMessage(number, media).then(response => {
            users.push(response);
        }).catch(err => {
            users.push(err);
        }));
        respon.push(client.sendMessage(number, caption));
    }

    Promise.all(respon).then(() => {
        res.json({
            status: true,
            response: users
        });
    });

});



//send media
app.post('/send-media-msg', async (req, res) => {

    const sender = req.body.sender;
    if (!sender) {
        res.status(404).json({
            status: false,
            response: "Not Number"
        });
    }
    const url = req.body.url;
    const caption = req.body.caption;
    const nomor = req.body.number;
    // const savedSessions = getSessionsFile();
    const client = sessions_aktif.find(sess => sess.id == sender).client;
    const number = phoneNumberFormatter(nomor);
    // let options = { mimetype: 'image/png' , caption: caption};
    //  const mediaUrl = await MessageMedia.fromUrl (url);
    let mimetype;
    const attachment = await axios.get(url, {
        responseType: 'arraybuffer'
    }).then(response => {
        mimetype = response.headers['content-type'];
        return response.data.toString('base64');
    }).catch(err => {
      console.log(err);
    });
    const media = new MessageMedia(mimetype, attachment, 'Media');
    client.sendMessage(number, media, {
        caption: caption
    }).then(response => {
        res.status(200).json({
            status: true,
            response: "Berhasil"
        });
    }).catch(err => {
        res.status(500).json({
            status: false,
            response: "Gagal"
        });
    });

});


});


server.listen(port, function() {
    console.log('App running on *: ' + port);
});
