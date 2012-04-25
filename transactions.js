var sys = require('util');
var amqp = require('amqp');
var io = require('socket.io').listen(8642);
var sessions = {};

function sessionFindOrCreateById(id){
	if(!sessions[id]){
		sessions[id] = new Session(id);
	}
	return sessions[id];
};

function Session(id){
	sys.p('created session with id: ' + id);
	this.id = id;
	this.messages = [];
};
Session.prototype = {
	setBrowserSocket: function(socket){
		sys.p('setting browser socket: ' + socket);
		this.browser = socket;
		while(this.messages.length > 0){
			this.browser.emit('new_msg',this.messages.shift());
		}
	},
	addMessage: function(msg){
		sys.p('added message: ' + msg);
		if(this.browser){
			this.browser.emit('new_json',msg);
		} else {
			this.messages.push(msg);
		}
	}
};
function Message (msg){
	sys.p('created message: ' + msg);
	this.message = msg;
};
var connection = amqp.createConnection({ host: 'localhost' });
connection.on('ready', function () {
  // Create a queue and bind to all messages.
  // Use the default 'amq.topic' exchange
	var e = connection.exchange('transactions',{type: 'topic'},
	function(){
	  var q = connection.queue('',{exclusive: true },
		function(queue){
			sys.p('Queue: ' + queue.name);
		  // Receive messages
		  q.subscribe(function (message, headers, deliveryInfo) {
	    // Print messages to stdout
		    sys.p(message.data.toString());
				sys.p("route: " + deliveryInfo.routingKey);
				session_id = deliveryInfo.routingKey.split('.').pop();
				session = sessionFindOrCreateById(session_id);
				session.addMessage(new Message(message.data.toString()));
		  });
		  q.bind(e.name,'transactions.#');

		});
	});
  // Catch all messages
});
io.sockets.on('connection', function (socket) {
	socket.on('session_id',function(session_id){
		sys.p('got session id from browser: ' + session_id);
		session = sessionFindOrCreateById(session_id);
		socket.emit('new_msg','got session id');
		session.setBrowserSocket(socket);
	});
	
});
