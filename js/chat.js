var chat = function(socket){
	this.socket = socket;
};

chat.prototype.sendMessage = function(room, txt){
	var msg= {
		room:room,
		text:txt
	};
	this.socket.emit('message', msg);
};

chat.prototype.changeRoom = function(room){
	this.socket.emit('join', {
		newRoom:room
	});
};