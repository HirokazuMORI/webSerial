jQuery(function($) {
	"use strict";
	var socket = io.connect('http://'+location.host+'/');

	//サーバーからの応答受信処理
	//open応答
	socket.on('open',function(data){
		if(data.result == 0){
			$('#open').prop('disabled',true);
			$('#close').prop('disabled',false);
			$('#send').prop('disabled',false);
		}
		else{
			alert(data.text);
			$('#open').prop('disabled',false);
			$('#close').prop('disabled',true);
			$('#send').prop('disabled',true);
		}
	});
	//close応答
	socket.on('close',function(data){
		$('#open').prop('disabled',false);
		$('#close').prop('disabled',true);
		$('#send').prop('disabled',true);
	});
	//シリアル受信文字
	socket.on('message',function(data){
		$('#log_recv').append(data.text);
	});
	//制御信号
	socket.on('ctrl',function(data){
		if(data.signal == 0){
			if(data.value == 0){
				$("#dsr").css("background-color","rgb(255,255,255)");
			}
			else{
				$("#dsr").css("background-color","rgb(255,0,0)");
			}
		}
		else{
			if(data.value == 0){
				$("#cts").css("background-color","rgb(255,255,255)");
			}
			else{
				$("#cts").css("background-color","rgb(255,0,0)");
			}
		}
		$('#log_recv').append(data.text);
	});



	//クライアントからの送信処理
	//open
	$('#open').click(function(){
		socket.emit('open');
		$('#open').prop('disabled',true)
	});
	//close
	$('#close').click(function(){
		socket.emit('close');
		$('#close').prop('disabled',true)
//		socket.disconnect();
	});
	//send
	$('#send').click(function(){
		var text = $('#input').val();
		if(text !== ''){
			//サーバにテキストを送信
			socket.emit('message',{text:text});
			$('#log_send').append(text);
		}
	});


	$("#rts").click(function(e){
		if($("#rts").css("background-color") == "rgb(255, 0, 0)"){
			socket.emit('ctrl',{signal:1,value:0});
			$("#rts").css("background-color","rgb(255,255,255)");
		}
		else{
			socket.emit('ctrl',{signal:1,value:1});
			$("#rts").css("background-color","rgb(255,0,0)");
		}
	});
	$("#dtr").click(function(e){
		if($("#dtr").css("background-color") == "rgb(255, 0, 0)"){
			socket.emit('ctrl',{signal:0,value:0});
			$("#dtr").css("background-color","rgb(255,255,255)");
		}
		else{
			socket.emit('ctrl',{signal:0,value:1});
			$("#dtr").css("background-color","rgb(255,0,0)");
		}
	});

});
