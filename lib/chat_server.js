var socketio=require('socket.io');
var io;
var guestNo =1;
var nickNames = {};
var namesUsed = {};
var currentRoom = {};

exports.listen=function(server){
	io = socketio.listen(server);

	io.set('log.level',1);

	io.sockets.on('connection', function(socket){
		guestNo = assignGuestName(socket, guestNo, nickNames, namesUsed);

		joinRoom(socket, 'Lobby');

		handleMessageBroadcasting(socket, nickNames);
		handleNameChangeAttempts(socket, nickNames, namesUsed);
		handleRoomJoin(socket);

		socket.on('rooms', function(){
			socket.emit('rooms', io.sockets.manager.rooms);

			handleClientDisconnet(sockets,nickNames, namesUsed);

		});
	});
};

function assignGuestName(socket, guestNo, nickNames, namesUsed){
	var name = 'guest'+guestNo;
	nickNames[socket.io] = name; //associate guest name with client connection ID

	socket.emit('nameResult', {
		success:true,
		name :name
	});

	namesUsed.push(name);
	return guestNo+1;
};

function joinRoom(socket, room){
	socket.join(room);
	currentRoom[socket.io] = room;

	socket.emit('joinResult', {room:room});

	socket.broadcast.to(room).emit('message', {
		text: nickNames[socket.io] +' has joined' + room
	});

	var usersInRoom = io.sockets.clients(room);

	if(usersInRoom.length>1){
		var usersInRoomSummary = 'Users currently in room '+room;
		for(var index in usersInRoom){
			var userSocketId  = usersInRoom[index].id;
			if(userSocketId!=socket.io){
				if(index>1){
					usersInRoomSummary+=', ';
				}
				usersInRoomSummary+=nickNames[userSocketId];
			}
		}
		socket.emit('message', {text: usersInRoomSummary});
	}

};

function handleNameChangeAttempts(socket, nickNames, namesUsed){
	socket.on('nameAttempt',function(name){
		if(name.indexOf('Guest')==0){
			socket.emit('nameResult', {
				success:false,
				message: 'can not use guest name'
			});
		} else {
			if(namesUsed.indexOf(name)==-1){
				var prevName = nickNames[socket.io];
				var prevNameIdx = namesUsed.indexOf(prevName);

				namesUsed.push(name);
				nickNames[socket.io]= name;

				delete namesUsed[prevNameIdx];

				socket.emit('nameResult', {
					success:true,
					message: name
				});			

				socket.broadcast.to(currentRoom[socket.io]).emit('message',{
					text:prevName+'is now '+name
				});
			} else {
				socket.emit('nameResult', {
					success:false,
					message: 'name already taken'
			});
			}
		}
	});
};

function handleMessageBroadcasting(socket, nickNames){
	socket.on('message', function(message){
		socket.broadcast.to(message.room).emit('message', {
			text:nickNames[socket.io]+':'+message.text
		});
	});
};

function handleRoomJoining(socket) {
	socket.on('join', function(room) {
	socket.leave(currentRoom[socket.id]);
	joinRoom(socket, room.newRoom);
	});
};

function handleClientDisconnection(socket) {
	socket.on('disconnect', function() {
		var nameIndex = namesUsed.indexOf(nickNames[socket.id]);
		delete namesUsed[nameIndex];
		delete nickNames[socket.id];
	});
}