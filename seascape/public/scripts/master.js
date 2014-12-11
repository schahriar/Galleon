var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');

// Initialize jQuery in BackBone
Backbone.$ = $;

var unknown = "unknown", fail = no = false, pass = yes = true, empty = "";

var client = new Object;

client.build = function(){
	var Model = Backbone.Model.extend({
		urlRoot: '/api',
		idAttribute: 'eID',
		
		// Default attributes
		defaults: function() {
			return {
				eID: undefined,
				from: { name:unknown, email:unknown },
				to: new Array,
				subject: unknown,
				
				text: empty,
				html: unknown,
				
				stamp: undefined
			};
		},

		initialize: function() {
			
		},

		store: function() {
			this.save();
		},
		
		setRead: function() {
			this.set('read', true);
		}

	});
	
	var Collection = Backbone.Collection.extend({
		url: '/api',

		// Reference to this collection's model.
		model: Model,
		
		initialize: function(){
			//this.model.on('sync', this.onSync);
			//this.model.on('error', this.onError);
			//this.model.on('destroy', this.onDestroy);
		},

		// Filter down the list of all unread emails.
		read: function(eID) {
			return this.model.setRead();
		}
	});

	var ItemView = Backbone.View.extend({
		tagName:  "article",

		template: _.template('<header><%- subject %></header>'),

		// The DOM events specific to an item.
		events: {
			"click .header"   : "clicked"
		},

		initialize: function() {
			//this.listenTo(this.model, 'change', this.render);
			//this.listenTo(this.model, 'destroy', this.remove);
		},

		render: function() {
			this.$el.html(this.template(this.model.toJSON()));
			return this;
		},
		
		clicked: function() {
			console.log("Just letting you know someone clicked on something");
		}

	});
	
	var Mail = new Collection;
	
	var View = Backbone.View.extend({
		el: "section#list",

		template: _.template('<header><div class="from"><%- from.email %></div><div class="subject"><%- subject %></div></header>'),

		initialize: function() {
			this.listenTo(Mail, 'all', this.render);
			
			Mail.fetch();
		},
		
		addOne: function(mail) {
			var el = $(this.el);
			var view = new ItemView({model: mail});

			if(!el.find('[data-eID="' + mail.get('eID') + '"]').length){
				var newElement = $(view.render().el);
				el.append(newElement);
				newElement.data('eID',mail.get('eID'));
			}
		},
		
		addAll: function() {
		  Mail.each(this.addOne, this);
		},

		render: function() {
			this.addAll();
		}

	});
	
	this.Model = Model;
	this.Mail = Mail;
	this.ItemView = ItemView;
	this.View = new View;
}

$(function(){ window.API = new client.build(); })