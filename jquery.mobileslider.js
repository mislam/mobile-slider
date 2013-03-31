/*global jQuery:false */

(function($) {

	"use strict";
	
	$.mobileSlider = function(el, options) {
		
		var
			$el = $(el),

			/* Configuration variables
			 * Default values are assgined
			 */
			NUM_VISIBLE_NUMERALS = 12,	/* total number of visible numerals */
			SLIDING_INTERVAL = 500,		/* number of milliseconds for sliding animation */

			ctx = null,
			imd = null,
			circ = Math.PI * 2,
			quart = Math.PI / 2,

			interval = 10,				/* one hundredth of the duration in milliseconds (default is 10)
										 * duration = how long each slide will take
										 * interval = duration/100
										 */

			canvas = null,				/* <canvas> element */
			img_container = null,		/* contains <img> elements */
			numeral_list = null,		/* numerals list <ul> element */

			num_slides = 0,				/* number of slides */

			top_numeral = 1,			/* the top numeral is initially at 1 */
			curr_slide_index = 0,		/* zero is the first slide index */							 
			progress = 0,				/* range of progress value is from 0 to 1 */

			$top_numeral,				/* jQuery object for top_numeral span */
			$curr_slide_index,			/* jQuery object for curr_slide_index span */
			$progress,					/* jQuery object for progress span */

			progress_timer = null,

			printConsole = function() {

				// print variables
				$top_numeral.text(top_numeral);
				$curr_slide_index.text(curr_slide_index);
				$progress.text(Math.ceil(progress*100));

				setTimeout(function() {
					printConsole();
				}, 50);
			},
					
			// draw progress bar
			drawProgress = function() {
				ctx.putImageData(imd, 0, 0);
				ctx.beginPath();
				ctx.arc(20, 20, 13, -quart, (circ * progress) - quart, false);
				ctx.stroke();
			},

			start = function() {
				
				// set active class to the current numeral
				numeral_list.children('li:nth-child(' + (curr_slide_index+1) + ')').children('span').addClass('active');

				animate();
			},

			// fires when progressbar is full on each slide
			oncomplete = function() {

				// remove the active class from the current numeral
				numeral_list.children('li:nth-child(' + (curr_slide_index+1) + ')').children('span').removeClass('active');

				// if current slide is not the last slide, then slide to the next slide
				if (curr_slide_index !== num_slides - 1)
				{
					// sliding animation
					img_container.animate(
					{
						'left': '-=320'
					},
					SLIDING_INTERVAL, function()
					{
						// move to the next numeral
						curr_slide_index++;

						if (curr_slide_index-top_numeral < NUM_VISIBLE_NUMERALS-1)
						{
							// move progressbar down
							$(canvas).css("margin-top", (curr_slide_index-top_numeral+1)*40);				
						}

						// animate again
						start();
					});


					if (curr_slide_index-top_numeral >= NUM_VISIBLE_NUMERALS-2)
					{			
						// increment the top numeral
						top_numeral++;

						// slide the numeral list <ul> up
						numeral_list.animate(
						{
							'margin-top': '-=40'
						},
						SLIDING_INTERVAL);
					}

				}

				// if reached to the last slide
				else
				{
					img_container.animate(
					{
						left: '0'
					},
					SLIDING_INTERVAL, function()
					{
						// slide the numeral list <ul> down to initial position (zero is at top)
						numeral_list.animate(
						{
							'margin-top': '0'
						},
						SLIDING_INTERVAL, function()
						{
							// reset top numeral to 1
							top_numeral = 1;

							// move progressbar back to the top
							curr_slide_index = 0;
							$(canvas).css("margin-top", "0");

							// loop animation
							start();
						});			
					});
				}
			},

			// performs loading animation
			animate = function() {

				progress_timer = setTimeout(function() {
					progress += 0.01;
					drawProgress();

					if (progress < 1)
					{
						animate();
					}
					else
					{
						// reset the progressbar to empty
						progress = 0;
						drawProgress();

						oncomplete();
					}

				}, interval);
			},

			// go to an specific slide
			gotoSlide = function(index) {

				// fix: when clicked on the top-numeral while the list is sliding up,
				// hide the progressbar from being displayed above the numeral list
				if (index < top_numeral-1)
				{
					$(canvas).css("margin-top", "0");
					top_numeral--;

					// slide the numeral list <ul> down
					numeral_list.animate(
					{
						'margin-top': '+=40'
					},
					SLIDING_INTERVAL);

				}

				else
				{
					$(canvas).css("margin-top", (index-top_numeral+1) * 40);
				}

				img_container.stop();

				// remove the active class from the current numeral
				numeral_list.children('li:nth-child(' + (curr_slide_index+1) + ')').children('span').removeClass('active');

				// set active class to the current numeral
				numeral_list.children('li:nth-child(' + (index+1) + ')').children('span').addClass('active');

				clearTimeout(progress_timer);	// stop the progressbar

				// reset the progressbar to empty
				progress = 0;
				drawProgress();			

				// sliding animation
				img_container.animate(
				{
					'left': index * -320

				}, SLIDING_INTERVAL, function()
				{
					curr_slide_index = index;
					start();	// loop animation
				});

			},

			/**
			 * Draw pagination to the left/right of the phone
			 */
			createPagination = function() {
				
				var i,
					position = ($el.find('.phone').attr('class').indexOf('left') !== -1) ? 'right' : 'left';
				
				$el.append(
					'<div class="numerals ' + position + '">' +
						'<canvas class="progressbar" width="40" height="40"></canvas>' +
						'<ul></ul>' +
					'</div>');
				
				numeral_list = $el.find('.numerals ul');
				
				// add click event listener to the numerals
				numeral_list.delegate('li', 'click', function() {
					var index = numeral_list.children('li').index($(this));
					gotoSlide(index);		
				});

				for (i = 1; i <= num_slides; i++ ) {
					numeral_list.append('<li><span>' + i + '</span></li>');
				}
			},

			/**
			 * Initialize the slideshow, set up canvas
			 */
			init = function() {
				
				var opts = $.extend({}, $.mobileSlider.defaultOptions, options),
					
					phone = $el.find('.phone'),
					spinner,
					imgAnchors = $el.find('.phone').children('a'),
					imgUrls = [],
					loaded = [],
					phoneBgImgUrl,
					spinnerBgImgUrl;

				$.each(imgAnchors, function () {
					imgUrls.push($(this).attr('href'));
				});
			
				phone.html(
						'<div class="spinner"></div>' +
						'<div class="wrapper">' +
							'<div class="image_container"></div>' +
						'</div>');
			
				img_container = $el.find('.image_container');
				spinner = $el.find('.spinner');

				phoneBgImgUrl = phone.css('background-image').replace('url(','').replace(')','').replace(/"/g,'');
				spinnerBgImgUrl = spinner.css('background-image').replace('url(','').replace(')','').replace(/"/g,'');
				
				$('<img>').attr('src', spinnerBgImgUrl).load(function () {
					$('<img>').attr('src', phoneBgImgUrl).load(function () {
						spinner.show();

						$.each(imgUrls, function () {
							var imgObj = new Image();

							$(imgObj).bind('load', function() {
								loaded.push(this);
								if (loaded.length >= imgUrls.length) {

									spinner.hide();

									$.each(imgUrls, function() {
										img_container.append($('<img>').attr('src', this));
									});

									// count number of slides (images)
									num_slides = img_container.children('img').length;
									img_container.css('width', num_slides*320);

									createPagination();
									
									canvas = $el.find('.progressbar').get(0);
									ctx = canvas.getContext('2d');

									ctx.beginPath();
									ctx.strokeStyle = '#fff';
									ctx.lineCap = 'round';
									ctx.closePath();
									ctx.fill();
									ctx.lineWidth = 4.0;

									imd = ctx.getImageData(0, 0, 40, 40);

									if (opts.debug)
									{
										$el.find('.phone').prepend(
											'<div class="debug_console">' +
												'<div><span class="name">top_numeral</span><span class="value var_top_numeral">Value</span></div>' +
												'<div><span class="name">curr_slide_index</span><span class="value var_curr_slide_index">Value</span></div>' +
												'<div><span class="name">progress</span><span class="value var_progress">Value</span></div>' +
											'</div>');

										$top_numeral = $el.find('.var_top_numeral');
										$curr_slide_index = $el.find('.var_curr_slide_index');
										$progress = $el.find('.var_progress');

										printConsole();
									}

									start();	
								}
								$(imgObj).unbind('load error');
							});
							imgObj.src = this;
						});

					});
				});
				
				interval = opts.duration/100;
				SLIDING_INTERVAL = opts.transition;
			};
		
        
		init();
	};
    
	$.mobileSlider.defaultOptions = {
		duration: 5000,			// for how long each slide will display (milliseconds)
		transition: 500,		// specify the sliding speed (milliseconds)
		debug: false			// show/hide debugger panel
    };

	$.fn.mobileSlider = function(options) {
		return this.each(function() {
			$.mobileSlider(this, options);
		});
	};

}(jQuery));