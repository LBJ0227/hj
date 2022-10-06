var smManager = {
	controller: null,
	scenes: [],
	activeScene: null,
	panes: [],
	init: function () {
		smManager.controller = new ScrollMagic.Controller({
			globalSceneOptions: {
				triggerHook: 'onLeave'
			}
		});

		smManager.controller.scrollTo(function (newPos) {
			TweenMax.to(window, 0.5, {
				scrollTo:
					{
						y: newPos
					},
				ease: Power1.easeOut
				});
		});

		smManager.panes.forEach(function (element) {
			smManager.addScene(element);
		});
	},
	addScene: function (slide) {
		var options = {};
		if (slide.element)     options.triggerElement = slide.element;
		if (slide.duration)    options.duration       = slide.duration;
		if (slide.triggerHook) options.triggerHook    = slide.triggerHook;
		
		// Init Scene
		var scene = new ScrollMagic.Scene(options);

		// Add Events, hooks, etc
		if (slide.pin) {
			scene.setPin(slide.pin.element, slide.pin.options);
		}
		if (slide.tween) {
			var useTween = true;
			if (slide.tween.responsive) {
				if (viewport.width > slide.tween.maxWidth) {
					useTween = false;
				}
			}
			if (useTween === true) {
				var tween;
				tween = slide.tween.func(slide.tween.selector, slide.tween.duration, slide.tween.options[0]);
				scene.setTween(tween);
			}
		}
		if (slide.events) {
			slide.events.forEach(function (element) {
				scene.on(element.on, element.func);
			});
		}

		scene.on("progress", function (event) {
			smManager.zoomingVideoToggle();
		});

		scene.addTo(smManager.controller)
		smManager.scenes.push(scene);
	},
	zoomingVideoToggle: function () {
		// console.log("Current Position: ", smManager.controller.scrollPos());
		var currentPos = smManager.controller.scrollPos();
		var zoomingVideoElement = document.querySelector('section[id^="media-big-view_"] .zoomed');
		if (zoomingVideoElement) {
			if (currentPos > 3200) {
				if (zoomingVideoElement.classList.contains('hidden') === false) {
					zoomingVideoElement.classList.add('hidden');
				}
			} else {
				if (zoomingVideoElement.classList.contains('hidden') === true) {
					zoomingVideoElement.classList.remove('hidden');
				}
			}
		}
	}
};