
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path')
  , sio = require('./asyncSerial');

var app = express();

var com = 'COM3';
var port = '3000'

app.configure(function(){
  app.set('port', process.env.PORT || port);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

//app.get('/', routes.index);
app.get('/', function(req, res){
  res.render('index', { title: com });
});

var server = http.createServer(app);
server.listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

//socket.ioのインスタンス作成
var io = require('socket.io').listen(server);

var isOpen = 0;

//クライアントから接続があった時
io.sockets.on('connection',function(socket){
	//open
	socket.on('open',function(data){
		var ret = 0;
		var err = "";
		try{
			sio.open(com,9600,8,0,0);
			isOpen = 1;
		}
		catch(e){
			ret = -1;
			err = e.message;
		}
		console.log("open=" + ret + err);
		socket.json.emit('open',{result:ret,text:err});
		getSignal(socket,sio.ctrl());
		sio.recv(10,function rcv(ret,signal,txt){
			console.log(process.memoryUsage());
			if(ret === 0){
				if(txt){
					socket.json.emit('message',{text:txt})
				}
				getSignal(socket,signal);
			}
			if(ret < 0){
				console.log('recv result = ' + ret);
			}
			if(isOpen === 0){
				console.log("recv end");
				return;
			}
			sio.recv(10,rcv);
		});
	});
	//close
	socket.on('close', function(){
		sio.close();
		isOpen = 0;
		console.log("close");
		socket.json.emit('close',{result:0});
	});
	socket.on('message',function(data){
		if(data && typeof data.text === 'string'){
			sio.send(data.text,1000,function(result){
				console.log('send result = ' + result);
			});	
		}
	});
	//ctrl
	socket.on('ctrl', function(data){
		sio.ctrl(data.signal,data.value);
	});
	socket.on('disconnect', function(){
		if(isOpen === 1){
			sio.close();
		}
		isOpen = 0;
		console.log("disconnect");
	});
});

function getSignal(socket,signal){
	//cts
	if((signal & 0x10) == 0x10){
		socket.json.emit('ctrl',{signal:1,value:1})
	}
	else{
		socket.json.emit('ctrl',{signal:1,value:0})
	}
	//dsr
	if((signal & 0x20) == 0x20){
		socket.json.emit('ctrl',{signal:0,value:1})
	}
	else{
		socket.json.emit('ctrl',{signal:0,value:0})
	}
}
