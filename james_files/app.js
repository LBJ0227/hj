

document.addEventListener("DOMContentLoaded", function () {

	$(document).foundation();

	if (typeof smManager !== 'undefined') smManager.init();

	// Navigation
	nav.init();

	// Smooth Scroll
	document.querySelectorAll('[data-smooth-scroll]').forEach(function (element) {
		var target = null;
		var compensate = 0;

		if (element.dataset.dataSmoothScroll && element.dataset.dataSmoothScroll.length > 0) {
			target = document.querySelector(element.dataset.dataSmoothScroll);
		}

		if (element.dataset.dataSmoothScrollCompensate !== undefined) {
			compensate = Number(element.dataset.dataSmoothScrollCompensate);
		}

		if (target) smoothScroll(target, compensate);
	});

	// Standard foundation modal
	document.querySelectorAll("a[data-modal]").forEach(function (element) {
		element.addEventListener("click", function (event) {
			$($(this).attr("data-modal")).foundation('open');
		});
	});

	// VCT: Same Height
	document.querySelectorAll('[data-tile-expand]').forEach(sameHeight);
	// VCT: Expand toggle
	document.querySelectorAll('[data-tile-expand]').forEach(function (element) {
		element.addEventListener('click', tileExpand);
	});

	// Close VCT Modal
	document.querySelectorAll('.vct-close').forEach(function (element) {
		element.addEventListener("click", hideVctModal);
	});

	// Local Video Play button
	$('[data-play-control]').on("click", function () {
		var videoSelector = $(this).attr('data-play-control');
		var videoElement = $(this).siblings(videoSelector).get(0);
		videoElement.play();
		$(this).addClass('hide');
	});

	// Local video mute toggle
	$('[data-video-mute-toggle]').on("click", function () {
		if ($(this).children('i.fas').hasClass("fa-volume-up") === true) {
			// Unmute
			$(this).siblings('video')[0].controls = true;
			$(this).siblings('video')[0].muted = false;
			$(this).siblings('video')[0].loop = false;
			$(this).children('i.fas').removeClass("fa-volume-up").addClass("fa-volume-mute").addClass("hide");
			if (typeof $(this).data('smScene') !== 'undefined') {
				var sceneId = Number($(this).data('smScene'));
				smManager.controller.scrollTo(smManager.scenes[sceneId].scrollOffset() + smManager.scenes[sceneId].duration());
			}
		} else {
			$(this).siblings('video')[0].muted = true;
			$(this).children('i.fas').removeClass("fa-volume-mute").addClass("fa-volume-up");
		}
	});

	// Content slider arrows
	$("#progress-scroll-left").on("click", function () {
		if (smManager && smManager.activeScene) {
			var currentPos = window.scrollY;
			var sliderStartPos = smManager.activeScene.scrollOffset();
			var sliderEndPos = smManager.activeScene.scrollOffset() + smManager.activeScene.duration();
			var sliderPosWidth = sliderEndPos - sliderStartPos;

			var scrollWidth = (sliderPosWidth * 0.2);

			var scrollPosition = currentPos - scrollWidth;

			if (scrollPosition < (sliderStartPos * 1.08)) {
				scrollPosition = sliderStartPos;
			}
			smManager.controller.scrollTo(Math.round(scrollPosition));
		}
	});

	$("#progress-scroll-right").on("click", function () {
		if (smManager && smManager.activeScene) {

			var currentPos = window.scrollY;
			var sliderStartPos = smManager.activeScene.scrollOffset();
			var sliderEndPos = smManager.activeScene.scrollOffset() + smManager.activeScene.duration();
			var sliderPosWidth = sliderEndPos - sliderStartPos;

			var scrollWidth = (sliderPosWidth * 0.2);

			var scrollPosition = currentPos + scrollWidth;

			if (scrollPosition > (sliderEndPos * 0.92)) {
				scrollPosition = sliderEndPos;
			}
			smManager.controller.scrollTo(Math.round(scrollPosition));
		}
	});

	// Lasy loader
	window.addEventListener("scroll", unlazyCheck);
	(function () {
		unlazyCheck();
	})();
});

// Asset Preloader (loading)
var assetPreloads = {
	loaded: [],
	current: null,
	init: function () {
		if (docAssetPreloads) {
			assetPreloads.current = [];
			docAssetPreloads.forEach(function (element) {
				if (element.tag === 'image') {
					assetPreloads.current.push(element);
					// console.log("adding to preload queue:", element);
					element.el = new Image();
					element.el.src = element.src;
					element.el.addEventListener("load", function () {
						assetPreloads.checkState(element);
						// console.log("loaded: ", element);
					})
				} else if (element.tag === 'video') {
					assetPreloads.current.push(element);
					element.el = document.querySelector(element.src);
					// console.log("adding to preload queue:", element);
					if (typeof element.el === 'object') {
						element.el.addEventListener('progress', function () {
							assetPreloads.checkState(element);
							if (element.el.buffered.length === 0) return;
							// console.log("loaded: ", element);
						});
					}
				}
			});
		}
	},
	checkState: function (asset) {
		assetPreloads.loaded.push(asset);
		//console.log("Prime Assets loaded:", assetPreloads.loaded, 'of', assetPreloads.current);
		if (assetPreloads.loaded.length === assetPreloads.current.length) {
			assetPreloads.hidePreloader();
		}
	},
	hidePreloader: function () {
		//console.log("All Prime Assets loaded! Removing preload animation...");
		window.setTimeout(function () {
			$('#full-loading-initial').addClass("fade-out");
		}, 1200);
		window.setTimeout(function () {
			$('#full-loading-initial').addClass("hidden");
			$('body').removeClass("active");
		}, 2000);
		window.setTimeout(function () {
			$('body').removeClass("is-loading");
		}, 1600);

	}
};
if (typeof docAssetPreloads !== 'undefined') assetPreloads.init();


// Global: Window resize event listeners
window.addEventListener('resize', function () {
	viewport.setViewportDimensionVars();
});



// Viewport info utility
var viewport = {
	width: 0,
	height: 0,
	setViewportDimensionVars: function () {
		viewport.width = viewport.getViewportWidth();
		viewport.height = viewport.getViewportHeight();
	},
	getViewportDimensionVars: function () {
		viewportWidth = viewport.getViewportWidth();
		viewportHeight = viewport.getViewportHeight();
		return viewport;
	},
	getViewportWidth: function () {
		return document.documentElement.clientWidth;
	},
	getViewportHeight: function () {
		return document.documentElement.clientHeight;
	}
};
(function () {
	viewport.setViewportDimensionVars();
})();

// Same Height
var sameHeight = function () {
	window.setTimeout(function () {
		$('[data-same-height]').each(function (index, element) {
			if ($(this).attr('data-same-height')) {
				var containerElement = $(this);
				var minHeight = 0;
				$($(this).attr('data-same-height')).each(function (index, element) {
					$(this).css('height', '');
					// console.log('comparing ', $(this).height(), ' against ', minHeight);
					if ($(this).height() > minHeight) {
						// console.log('new minHeight is NOW ', $(this).height());
						minHeight = $(this).height();
					}
				});
				$($(this).attr('data-same-height')).each(function (index, element) {
					$(this).css('height', minHeight + "px");
				})
			}
		});
	}, 500);
}

var nav = {
	openButtons: null,
	closeButtons: null,
	navWindow: null,
	openNav: function () {
		nav.navWindow.classList.add("active");
		document.getElementById("nav-header").classList.add("hide");
		nav.openButtons.forEach(function (element) {
			element.classList.add("hide");
		});
	},
	closeNav: function () {
		nav.navWindow.classList.remove("active");
		document.getElementById("nav-header").classList.remove("hide");
		nav.openButtons.forEach(function (element) {
			element.classList.remove("hide");
		});
	},
	toggleNav: function () {

	},
	init: function () {
		nav.openButtons = document.querySelectorAll('[data-nav-open]');
		nav.closeButtons = document.querySelectorAll('[data-nav-close]');
		nav.navWindow = document.getElementById("navigation-window");

		document.addEventListener("keyup", function (event) {
			// console.log("doc Keyup: ", event);
			if (nav.navWindow.classList.contains("active")) {
				if (event.keyCode === 27) {
					event.preventDefault();
					nav.closeNav();
				}
			}
			if (event.keyCode === 27) {
				document.querySelectorAll(".v-tiles .tile").forEach(function (element) {
					if (element.classList.contains("max")) {
						if (viewport.width < 640) {
							hideVctModal();
						} else {
							element.click();
						}
					}
				});
			}
		});

		nav.openButtons.forEach(function (element) {
			element.addEventListener("click", nav.openNav);
		});
		nav.closeButtons.forEach(function (element) {
			element.addEventListener("click", nav.closeNav);
		});

		document.querySelectorAll(".hero-nav a").forEach(function (element) {
			element.addEventListener('click', nav.closeNav);
		});
	}
}

// Video unmute toogle
function videoControlsToggle (ele) {

}

function unlazyCheck () {
	lazyElements.forEach(function (element) {
		if (isCloseToViewport(element.ele) === true && element.loaded === false) {
			loadLazyVideoElements(element.ele);
			loadLazyImageElements(element.ele);
			loadLazyBackgroundImageElements(element.ele);
			element.loaded = true;
		}
		if (hasPassedViewport(element.ele) === true && element.loaded === true) {
			pausePlayingVideosThatHaveControls(element.ele);
		}
	});
}

function isCloseToViewport (element) {
	return (element.getBoundingClientRect().top < (viewport.height * 2.5));
}

function hasPassedViewport (element) {
	return (element.getBoundingClientRect().top < (viewport.height * 2.5) * -1);
}

// Grabs lazy videos and and gives 'em a kick
function loadLazyVideoElements (baseObj) {
	$(baseObj).find("video[data-source]").each(function (index) {
		// console.log("unlazying", this);
		
		if ($(this).children("source").length === 0) {
			var srcEle = document.createElement("source");
			srcEle.src = this.dataset.source;
			srcEle.type = "video/mp4";
			$(this).append(srcEle);
			if (this.autoplay === true) {
				this.play();
			}
		}
	});
}

function loadLazyImageElements (baseObj) {
	$(baseObj).find("img[data-source]").each(function (index) {
		if ($(this).data("source")) {
			this.src = this.dataset.source;
			// this.dataset.source = null;
		}
	});
}

function loadLazyBackgroundImageElements (baseObj) {
	$(baseObj).find("[data-bg-image]").each(function (index) {
		if (this.dataset.bgImage) {
			this.style.backgroundImage = "url('" + this.dataset.bgImage + "')";
			// this.dataset.source = null;
		}
	});
}


function pausePlayingVideos (baseObj) {
	$(baseObj).find("video").each(function (index) {
		if ($(this).data("source") && isMediaPlaying(this) === true) {
			this.pause();
		}
	});
}

function pausePlayingVideosThatHaveControls (baseObj) {
	$(baseObj).find("video").each(function (index) {
		if (this.controls === true) {
			this.pause();
		}
	});
}

function isMediaPlaying (mediaObject) {
	if (mediaObject.currentTime > 0 && mediaObject.paused === false && mediaObject.ended === false && mediaObject.readyState > 2) {
		return true;
	}
	return false;
}



// Loading overlays
function showLoading (color) {
	if (typeof color === 'undefined') {
		$('#full-loading').addClass('active');
	} else {
		$('#full-loading-' + color).addClass('active');
	}
}
function hideLoading (color) {
	$('#full-loading').removeClass('active');
	$('#full-loading-white').removeClass('active');
}

// VCT Content Expand
var tileExpand = function () {
	if (viewport.width < 640) {
		$("#vct-overlay").removeClass("hidden");

		$("#vct-content").html($(this).children('.expanded-content').html());
		$("#vct-content").removeClass("hidden");
	} else {
		var minimizing = false;
		if ($(this).hasClass("max")) {
			$(this).removeClass("max");
			minimizing = true;
		}
		$(this).parent().children('.tile').each(function (index, element) {
			$(element).removeClass("min");
			$(element).removeClass("max");
		});
		if (minimizing === false) {
			$(this).addClass("max");
			$(this).siblings().each(function (index, element) {
				$(element).addClass("min");
			});
		}
	}
};
// VCT Modal
var hideVctModal = function () {
	$("#vct-overlay").addClass("hidden");
	$("#vct-content").addClass("hidden");
	$("#vct-content").html("");
}

// HTML Escape
function entityStrip (str) {
	var br = RegExp(/(%3Cbr%3E)/g); // Replace <br> with encoded line breaks
	var listOpen = RegExp(/(%3C[ou]l%3E)/g); // Replace opening ol/ul
	var extraSpace = RegExp(/(%20){2,}/g); // Extra spaces ghet rendered, remove them
	var listClose = RegExp(/(%3C\/[ou]l%3E)/g); // Replace closing ol/ul
	var li = RegExp(/(%3Cli%3E)/g); // Replace <li> with a line break, hyphen and extra space
	var htmlTags = RegExp(/%3C[^\%3C]+\%3E/g); // Replace remaining HTML tags
	str = str.replace(br, '%0D%0A');
	str = str.replace(li, '%0D- ');
	str = str.replace(listOpen, '%0D%0A');
	str = str.replace(listClose, '%0D%0A');
	str = str.replace(htmlTags, '');
	str = str.replace(extraSpace, '%20');
	return str;
}
