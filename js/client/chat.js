// Framework global variable
var UW = UW || {};

UW.ChatEntry = Backbone.Model.extend({});

UW.ClientCountModel = Backbone.Model.extend({
    defaults: {
        "clients": 0
    },

    updateClients: function(clients){
        this.set({clients: clients});
    }
});

UW.NodeChatModel = Backbone.Model.extend({
    defaults: {
        "clientId": 0
    },

    initialize: function() {
        this.chats = new UW.ChatCollection(); 
    }
});

UW.ChatCollection = Backbone.Collection.extend({
    model: UW.ChatEntry
});


UW.ChatView = Backbone.View.extend({
  initialize: function(options) {
      _.bindAll(this, 'sendMessage');
      //this.model.chats.bind('add', this.addChat);
      this.dashboard = options.dashboard;
      this.dashboard.bind("chatMessage", this.addChat);
  },
  
  events: {
      "submit #chatMessageForm" : "sendMessage",
  },
  
  addChat: function(message) {
      //var view = new ChatView({model: chat});
      $('#chatList').append("<div class='chatMessage'>" + "Anonymous:" + message.data.text + "</div>");
  },
  
  msgReceived: function(message){
      switch(message.event) {
          case 'initial':
              this.model.mport(message.data);
              break;
          case 'chat':
              var newChatEntry = new models.ChatEntry();
              newChatEntry.mport(message.data);
              this.model.chats.add(newChatEntry);
              break;
          case 'update':
              this.clientCountView.model.updateClients(message.clients);
              break;
      }
  },
  
  sendMessage: function(){
      var chatMessage = $('input[name=chatMessage]').val();
      $('input[name=chatMessage]').val("");
      //var chatEntry = new models.ChatEntry({name: nameField.val(), text: inputField.val()});
      this.dashboard.sendChatMessage(chatMessage);      
      //inputField.val('');
  }
});

