var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');

var moment = require('moment');

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
				excerpt: empty,
				html: unknown,
				
				stamp: undefined
			};
		},

		initialize: function() {
			this.createExcerpt();
		},

		store: function() {
			this.save();
		},
		
		setRead: function() {
			this.set('read', true);
		},
		
		createExcerpt: function() {
			var text = this.get('text');
			var excerpt = text.substring(0, 200);
			
			if(text!=excerpt) excerpt += "...";
			this.set('excerpt', excerpt);
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

		template: _.template(
			'<header>'
				+'<img class="image" src="http://placehold.it/64x64"/>'
				+'<div class="pure-g">'
					+'<div class="pure-u-1-5 info">'
						+'<div class="email"><%- sender %></div>'
						+'<div class="subject"><%- subject %></div>'
					+'</div>'
					+'<div class="pure-u-3-5 short">'
						+'<div class="excerpt"><%- excerpt %></div>'
					+'</div>'
				+'</div>'
				+'<div class="date"></div>'
			+'</header>'),

		initialize: function() {
			//this.listenTo(this.model, 'change', this.render);
			//this.listenTo(this.model, 'destroy', this.remove);
		},

		render: function() {
			this.$el.html(this.template(this.model.toJSON()));
			return this;
		}
	});
	
	var MailView = Backbone.View.extend({
		tagName:  "section",

		template: _.template(
			'<header class="pure-g">'
				+'<h2><%- subject %></h2>'
				+'<div class="pure-u-4-5 details">From <%- sender %> to <span>You</span></div>'
				+'<div class="pure-u-1-5 date"></div>'
			+'</header>'
			+'<section>'
				+'<div class="html"></div>'
				+'<div class="reply></div>'
			+'</section>'),

		initialize: function() {
			//this.listenTo(this.model, 'change', this.render);
			//this.listenTo(this.model, 'destroy', this.remove);
		},

		render: function() {
			//class="mail" data-eid="<%- sender %>">
			this.$el.html(this.template(this.model.toJSON()));
			return this;
		}
	});
	
	var Mail = new Collection;
	
	var View = Backbone.View.extend({
		el: $("section#list"),
		view: $("#view"),
		
		// The DOM events specific to an item.
		events: {
			"click article"   : "load"
		},

		initialize: function() {
			this.listenTo(Mail, 'all', this.render);
			
			Mail.fetch();
		},
		
		addOne: function(mail) {
			// Refresh element
			this.el = $("section#list");
			
			var view = new ItemView({model: mail});

			if(!this.el.find('[data-eid="' + mail.get('eID') + '"]').length){
				var newElement = $(view.render().el);
				newElement.attr('data-eid',mail.get('eID'));
				
				// Add better date parsing
				newElement.find('.date').text(moment(mail.get('stamp').sent).startOf('day').fromNow());
				
				this.el.prepend(newElement);
			}
		},
		
		addAll: function() {
		  Mail.each(this.addOne, this);
		},
		
		load: function(e) {
			// Ripple effect
			this.ripple(e);
			
			// Refresh elements
			this.el = $("section#list");
			this.view = $("#view");
			
			var element = $(e.currentTarget);
			
			/* -- Toggle MailView Pane -- */
			
			var isActive = element.is('.active');
			this.toggleMailView(isActive);
			if(isActive) element.removeClass('active');
			
			/* -- -------------------- -- */
			
			/* -- Switch active element -- */
			
			if(!isActive){
				element.parent().find('.active').removeClass('active');
				element.addClass('active');
			}
			
			/* -- --------------------- -- */

			var mail = Mail.findWhere({ 'eID': element.attr('data-eid') });
			
			if(!mail) console.warn("No EMAIL found!");
			var view = new MailView({model: mail});
			
			var newElement = $(view.render().el);
			newElement.attr('data-eid',mail.get('eID'));

			// Add better date parsing
			newElement.find('.date').text(moment(mail.get('stamp').sent).startOf('day').fromNow());
			
			// ADD XSS Protection
			newElement.find('.html').html(mail.get('html'));

			this.view.html(newElement);
		},
		
		toggleMailView: function(toggle){
			if(toggle) {
				$('#plist').removeClass('pure-u-8-24').addClass('pure-u-20-24');
				$('#view').removeClass('pure-u-12-24').addClass('pure-u-0-24');
				
				$('#plist>header>.info').removeClass('pure-u-4-5').addClass('pure-u-1-5');
				$('#plist>header>.short').removeClass('pure-u-0-24').addClass('pure-u-3-5');
			}else{
				$('#plist').removeClass('pure-u-20-24').addClass('pure-u-8-24');
				$('#view').removeClass('pure-u-0-24').addClass('pure-u-12-24');
				
				$('#plist>header>.info').removeClass('pure-u-1-5').addClass('pure-u-4-5');
				$('#plist>header>.short').removeClass('pure-u-3-5').addClass('pure-u-0-24');
			}
		},
		
		/* Credits go to CodePlayer at http://thecodeplayer.com/walkthrough/ripple-click-effect-google-material-design */
		ripple: function(e){
			var element = $(e.currentTarget);
			//create .ink element if it doesn't exist
			if(element.find(".ink").length == 0)
				element.prepend("<span class='ink'></span>");

			var ink = element.find(".ink");
			//incase of quick double clicks stop the previous animation
			ink.removeClass("animate");

			//set size of .ink
			if(!ink.height() && !ink.width())
			{
				//use element's width or height whichever is larger for the diameter to make a circle which can cover the entire element.
				d = Math.max(element.outerWidth(), element.outerHeight());
				ink.css({height: d, width: d});
			}

			//get click coordinates
			//logic = click coordinates relative to page - element's position relative to page - half of self height/width to make it controllable from the center;
			x = e.pageX - element.offset().left - ink.width()/2;
			y = e.pageY - element.offset().top - ink.height()/2;

			//set the position and add class .animate
			ink.css({top: y+'px', left: x+'px'}).addClass("animate");
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