//把数据记录到mysql
var mysql   = require('mysql');

var connection = mysql.createConnection({
 user   : 'root',
 password : '',
 database : 'oneteam'
});
connection.connect();

//client.query('insert into test (username ,password) values ("lupeng" , "123456")');

//connection.end();

//mongodb
var mongoose = require('mongoose');
var url = 'mongodb://localhost/oneteam' ;
mongoose.connect(url);


//////////////////////////////////////

var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    users = [];
//specify the html we will use
app.use('/', express.static(__dirname + '/www'));
//bind the server to the 80 port
//server.listen(3000);//for local test
server.listen(process.env.PORT || 3000);//publish to heroku
//server.listen(process.env.OPENSHIFT_NODEJS_PORT || 3000);//publish to openshift
//console.log('server started on port'+process.env.PORT || 3000);
//handle the socket
io.sockets.on('connection', function(socket) {
    //new user login
    socket.on('login', function(nickname) {
        if (users.indexOf(nickname) > -1) {
            socket.emit('nickExisted');
        } else {
            socket.userIndex = users.length;
            socket.nickname = nickname;
            users.push(nickname);
            socket.emit('loginSuccess');
            io.sockets.emit('system', nickname, users.length, 'login');
            saveMsg2db('system',nickname+' login');
            saveMsg2mgdb('system',nickname+' login');
        };
    });
    //user leaves
    socket.on('disconnect', function() {
        users.splice(socket.userIndex, 1);
        socket.broadcast.emit('system', socket.nickname, users.length, 'logout');
        saveMsg2db('system',socket.nickname+' logout');
        saveMsg2mgdb('system',socket.nickname+' logout');
    });
    //new message get
    socket.on('postMsg', function(msg, color) {
        socket.broadcast.emit('newMsg', socket.nickname, msg, color);
        saveMsg2db(socket.nickname,msg);
        saveMsg2mgdb(socket.nickname,msg);
    });
    //new image get
    socket.on('img', function(imgData, color) {
        socket.broadcast.emit('newImg', socket.nickname, imgData, color);
        saveMsg2db(socket.nickname,"---imgData---");
        saveMsg2mgdb(socket.nickname,imgData);
    });
});

function saveMsg2db(nickname,msg){
    console.log("start savedb start");
    var date = new Date();
    year = date.getFullYear();
    month = (date.getMonth()+1);
    day = date.getDate();
    hour = date.getHours();
    minuter = date.getMinutes();
    second = date.getSeconds();
    name = '';
    temp='"'+year+'","'+month+'","'+day+'","'+hour+'","'+minuter+'","'+second+'","'+name+'","'+nickname+'","'+msg+'"';
    //这里应该加个服务器连接状态的判断
    connection.query('insert into message (year,month,day,hour,minuter,second,name,nickname,msg) values ('+temp+');');
    console.log("start savedb end");
}
function saveMsg2mgdb(nickname,msg){
    console.log("start savemgdb start");
    var date = new Date();
    year = date.getFullYear().toString();
    month = (date.getMonth()+1);
    if (month<10) month ="0"+month;
    day = date.getDate();
    if (day<10) day = "0"+day;
    hour = date.getHours().toString();
    if (hour<10) hour = "0"+hour;
    minuter = date.getMinutes();
    if (minuter<10) minuter = "0"+minuter;
    second = date.getSeconds();
    if (second<10) second = "0"+second;
    var temp ={
    day : year+month+day,
    time : hour+minuter+second,
    name : '',
    nickname : nickname,
    msg : msg
    }

    var mg_users = mongoose.model(nickname,{
    day: String,
    time: String,
    name: String,
    nickname: String,
    msg: String
    })
    
    var newmsg = new mg_users (temp) ;
    newmsg.save(function (err) {
        if (err) // ...
        console.log('mongoose save error');
    });

}
