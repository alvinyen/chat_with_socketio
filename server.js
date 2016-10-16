var express = require('express');
var http = require('http'); //socketio需要1個httpServer作為物件，因此手動用core module：http module來產生http server
var socketio = require('socket.io');
var path = require('path');

var app = express();
var server = http.createServer(app);
//var nicknames = [];
var users = {} ;

//小心注意..一定要接『伺服器端的socketio的實例』啊！！...不要直接拿require的core module來用...
var socketio_serverInstance = socketio.listen(server);

server.listen(3000);

console.log('server is running on port 3000 now..');

app.get('/',function(req,res){
    res.sendFile( path.join( __dirname , '/public/index.html') );
});

            //注意是socket"s" !!! logic !!!
socketio_serverInstance.sockets.on('connection',function(socket){  //這裡的socket代表user端的socket
    socket.on('send message',function(data , callback){

        var rawMsg = data.trim();
                    //代表字串index 0~2
        if( rawMsg.substr(0,3) === '/w '){
            var namePmsg = rawMsg.substr(3);
            if( namePmsg.indexOf(' ') !== -1 ){
                console.log('valid the username and handle the private msg..');
            }else{
                callback('error！！pls enter a msg for your whisper..');
                //↑↑↑客戶端的扣中，callback內容含有jQuery，為何有辦法在server端去執行？？
            }
        }else{
            //因為是即時聊天app，所以只要有客戶送資料過來，『則其他有連接的客戶端都要把這個資料同步出去！！』
            socketio_serverInstance.sockets.
            emit('new message', { "nickname":socket.nickname , "msg": data } ); //送出資料給所有連接使用者 !!! including me !!!『包含』送資料過來的那個使用者
            //     類似的function
            //socketio_serverInstance.broadcast.emit('new message',data); //送出資料給所有連接使用者!!!except me !!!『除了』送資料過來的那個使用者
        }




    });

    function updateUserList(){
        // socketio_serverInstance.sockets.emit( 'user list changed' , nicknames);
        // socketio_serverInstance.sockets.emit( 'user list changed' , users);
                                            //等等...不要像上面那樣直接送整個物件過去，太奇怪了，我們送key array 過去就好..
        socketio_serverInstance.sockets.emit( 'user list changed' , Object.keys(users));
    }

    socket.on('new user check' , function( data , callback ){
        console.log(data);

        // if(nicknames.indexOf(data) != -1){
        if( data in users ){
            callback(false); //或是callback({"isValid":false});
        }else{
            socket.nickname = data;
            callback(true);
            // nicknames.push(data);
            users[socket.nickname] = socket; //in ch3,改用nickname 作為id , socket則為value
            // console.log(nicknames);
            console.log(socket.nickname);
            updateUserList();
        }
    });

    socket.on('disconnect' , function(data){
        if(!socket.nickname) return;
        // nicknames.splice( nicknames.indexOf(socket.nickname) , 1);
        delete users[socket.nickname];
        updateUserList();
    })

});


