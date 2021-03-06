( function( $, w, domino, undefined ){
	/*


		Application dedicated domino
		configuration and modules
		Support Handlebars for template rendering.
		Requirement: domino, maize and jquery

	*/
	var maize = w.maize || {};
	maize.domino = {};
	maize.domino.api = {};
	maize.domino.urls = {};


	/*


		JsonRPC implementation
		======================

		Note: Require jsonRPC lib
		Thanks to:
		https://raw.github.com/datagraph/jquery-jsonrpc/master/jquery.jsonrpc.js

	*/
	maize.domino.JsonRPCBuilder = function( model, ns ){
		var _this = this;
		_this.model = model;
		_this.ns = ns;

		/*

			Print out the pseudo identifier for this jsonrpc wrapper instance
		*/
		this.label = function( joiner ){

			return typeof _this.ns == "undefined"? _this.model: [_this.ns, _this.model].join( typeof joiner== "undefined"? "." : joiner )
		}

		/*

			Execute the call, with jsonrpc params (usually a list) and a callback function.
			A proceed adn a fault arguments are available (but not necessary) to hook json response validation.
			Proceed function valudate the json result even if a "success" has been received.
			Cfr the default proceed and fault function.

			@param params -	list
			@param callback - function
			@param proceed - function (optional, override the existing one)
			@param fault - funciton (optional, override the existing one)
		*/
		this.execute = function( params, callback, proceed, fault ){ maize.log( '<maize.domino.JsonRPCBuilder:' + _this.label() +'> execute]' , params );
			$.jsonRPC.request( _this.label("_"),{ 
				params : params,
				success: function( result ){ typeof proceed == "undefined"? _this.proceed( result, callback ):proceed( result, callback); }, 
				error: typeof fault == "undefined"?  _this.fault: fault });
		};

		/*

			Verify response when a success responce has been received.
		*/
		this.proceed = function( result, callback ){ maize.log( '<maize.domino.JsonRPCBuilder:' + _this.label() +'> proceed]' , result );
			// proceed to callback, check result.status == 'ok' or similar @todo !
			callback( result );
		}

		/*
			REAL FAULT
			(server not responding)
		*/
		this.fault =function( result ){ maize.log( '<maize.domino.JsonRPCBuilder:' + _this.label() +'> jsonrpc fault]' , result );
			maize.fault( result.error );
		}

		maize.log( '<maize.domino.JsonRPCBuilder:' + _this.label() +'> init]', model );
	};


	/*


		Domino properties dummy properties compiler
		===========================================

	*/
	maize.domino.compile = function( urls, ns ){ maize.log( '[maize.domino.compile]', typeof ns == "undefined"? "" :[ns, i].join(".") );
		var _api = {}; for (var i in urls ){ _api[ i ] = typeof urls[i] == 'string'? new maize.domino.JsonRPCBuilder( i, ns ): maize.domino.compile ( urls[i], typeof ns == "undefined"? i :[ns, i].join(".") );}
		return _api;
	}



	maize.domino.ready = function(){ maize.log( '[maize.domino.ready]' );
		$.jsonRPC.setup({ endPoint : 'http://localhost:8080', namespace : ''});
		maize.domino.api = maize.domino.compile( maize.domino.urls );

		$("#test-json").on("click", function( event ){ event.preventDefault(); maize.domino.api.echo.execute([$("#echo_input").val()], function(data){maize.log(data); maize.toast( data.result, "received");}) });

		// maize.domino.structure();

		maize.d = new domino({
			properties: [
				/*{
					
						Story. Basically, a collection of chapters :D
						Increment its value to land somewhere.
					
					id: 'story',
					label: 'the  right story',
					value: [ 'introduction', 'the-hero' ],
					type: 'array',
					triggers: 'domino.story.ascend',
					dispatch: 'domino.story.landed'
				},
				*/
				{	
					/*
						Chapter. Basically, a stepper.
						Increment its value to land somewhere.
					*/
					id: 'chapter',
					label: 'story chapter',
					value: '0',
					type: 'string',
					triggers: 'chapter.switch',
					dispatch: 'chapter.landed'
				}
			], hacks:[
				{
					triggers: 'chapter.switch',
					method: function( event ) { // launch autosave
						maize.log( '[hack:chapter.switch] ui:', event.data.ui, ";", event.data.chapter, event);
						
						if (typeof maize.d.current == "undefined"){
							maize.d.current = [];
						};	

						if ( event.data.ui == "modal" ){
							$('.modal').modal('hide');
							$("#" + event.data.chapter ).modal('show');
							return;
						}

						if( event.data.ui == "stack" ){
							$("#" + event.data.chapter ).removeClass("out").addClass("ready");
							$("#" + event.data.chapter ).addClass("in");
							if(maize.d.current.length){
								$("#" + maize.d.current +".in").removeClass("in").removeClass("ready").addClass("out");
							}
							maize.d.current = event.data.chapter;
							//maize.d.story.push( event.data.chapter );

							//$("#" + maize.d.story[ maize.d.story.length - 1 ] +".in").addClass("out");
						}
							

						// get domino object ??
						if (typeof maize.d.story == "undefined"){
							maize.d.story = ["c-index"];
						}	
						$("#" + maize.d.story[ maize.d.story.length - 1 ] ).addClass("back"); 
						maize.d.story.push( event.data.chapter );
						$("#" + event.data.chapter ).show().addClass("in");

						return;
						if (!this.get('updating'))
							this.request('getValue');

						this.updating = false;
					}
				},
				{
					triggers: 'chapter.landed',
					method: function( data ) {
						maize.log( '[hack:chapter.landed]', data);
						return;
						if (!this.get('updating'))
							this.request('getValue');

						this.updating = false;
					}
				}
			]
		});

		maize.domino.module.ready();
	};

	
	/*


		Domino Modules
		==============
	*/
	maize.domino.module = {};
	maize.domino.module.Chapter = function( options ) {
		domino.module.call(this);
		maize.log( '<maize.domino.module.Chapter>', options);
		var self = this,
		o = $.extend({
			story:'',
			index:'',
			element:[] // jquery *empty* element
		}, options);

		this.html = o.element

	};

	maize.domino.module.ChapterLink = function( options ) {
		domino.module.call(this);
		maize.log( '<maize.domino.module.ChapterLink>', options);
		var self = this,
			o = $.extend({
				value:'',
				ui:'modal', // values are 'stack'|'modal'|undefined
				element:[] // jquery *empty* element
			}, options);

		this.html = o.element.on('click', function( event ){
			event.preventDefault();
			maize.log( '<maize.domino.module.ChapterLink> on click', o.value);
			self.dispatchEvent('chapter.switch', {'chapter':o.value, 'ui':o.ui});
		});
	}


	maize.domino.module.ready = function(){
		// create chapter
		$("[data-domino-module=Chapter]").each( function(i, e){
			
			var el = $(this),
				story = el.attr('data-story'),
				index = el.attr('id')

				// note: 'next' link can be overridden by children with data-chapter-next data-story-jump "Jumper" moudles
				// next chapter event will be trigger from 
			
			maize.log( '[maize.domino.module.ready]', 'data-domino-module=Chapter',  index );
			// a chapter *must* manifest a data-story and a data-chapter-index
			
			maize.d.addModule( maize.domino.module.Chapter, [{
				value: index,
				property: 'chapter',
				element: el
			}]);
			
		});

		// setup chapter button behaviour
		$("[data-domino-module=ChapterLink]").each( function(i, e){
			var el = $(this),
				target = el.attr('data-href');

			maize.log( '[maize.domino.module.ready]', 'data-domino-module=ChapterLink',  target );

			maize.d.addModule( maize.domino.module.ChapterLink, [{
				value: target,
				ui : el.attr('data-ui'),
				property: 'chapter',
				element: el
			}]);
		});
		
	}

})( jQuery, window, domino );
