/// </ reference path"../all.d.ts" />

import classie = require('classie');
import Modernizr = require('Modernizr')
import imagesLoaded = require('imagesloaded');

module transitions {
	
	var support = {transitions: Modernizr.csstransitions};
	var transEndEventNames ={'WebkitTransition': 'webkitTransitionEnd', 'MozTransition': 'transitionend', 'OTransition': 'oTransitionEnd', 'msTransition': 'MSTransitionEnd', 'transition': 'transitionend'}	
	var transEndEventName = transEndEventNames[Modernizr.prefixed('transition') ];
	
	export function onEndTransition(el: HTMLElement, callback: Function) {
		var onEndCallbackFn = (ev:Event)=>{
			if( support.transitions ) {
				if(ev.target != this ) return;
				this.removeEventListener (transEndEventName, onEndCallbackFn);
			}
			if(callback && typeof callback ==='function') {callback.call(this); }
		}
	}
}

module functions {
	export function throttle(fn: Function, delay: number) {
		var allowSample = true;

		return function(e) {
			if (allowSample) {
				allowSample = false;
				setTimeout(function() { allowSample = true; }, delay);
				fn(e);
			}
		};
	}

	export function nextSibling(el: HTMLElement) {
		var nextSibling = el.nextSibling;
		while (nextSibling && nextSibling.nodeType != 1) {
			nextSibling = nextSibling.nextSibling
		}
		return nextSibling;
	}

	export function extend(a: Object, b: Object) {
		for (var key in b) {
			if (b.hasOwnProperty(key)) {
				a[key] = b[key];
			}
		}
		return a;
	}
}
/**
 * GridFx obj
 */

interface IGridFxOptions {
	pagemargin: number,
	imgPosition: { x: number, y: number },
	onInit: (instance: gridFx) => boolean;
	onResize: (instance: gridFx) => boolean;
	onOpenItem: (instance: gridFx, item:HTMLElement) => boolean;
	onCloseItem: (instance: gridFx,item:HTMLElement) => boolean;
	onExpand: (instance: gridFx) => boolean;
}

class gridFx {

	public options: IGridFxOptions;
	public current: number;
	public items: HTMLElement[];
	public previewEl: HTMLElement;
	public isExpanded: boolean;
	public isAnimating: boolean;
	public closeCtrl: HTMLElement;
	public previewDescriptionEl: HTMLElement;
	private cloneImg: HTMLImageElement;
	private originalImg: HTMLImageElement;

	constructor(public gridEl: HTMLElement, options: IGridFxOptions) {

		this.options = functions.extend({}, this.options);
		functions.extend(this.options, options);

		this.items = [].slice.call(this.gridEl.querySelectorAll('.grid_item'))
		this.previewEl = <HTMLElement>functions.nextSibling(this.gridEl);
		this.isExpanded = false;
		this.isAnimating = false;
		this.closeCtrl = <HTMLElement>this.previewEl.querySelector('button.action--close');
		this.previewDescriptionEl = <HTMLElement>this.previewEl.querySelector('description--preview');
	
		
	}
	
	private _initEvents () {
		
		var clickEvent = (document.ontouchstart!==null ? 'click' : 'touchstart');
		
		this.items.forEach(i=>{
			var touchend = (ev:Event)=> {
				ev.preventDefault();
				this._openItem(ev,i);
				i.removeEventListener('touchend',touchend);
			}
			
			var touchmove = (ev: Event)=>{
				i.removeEventListener('touchend',touchend);	
			}
			
			var manageTouch = (ev: Event)=>{
				if(clickEvent === 'click') {
					ev.preventDefault();
					this._openItem(ev,i);
				}
			}
		})
		
		this.closeCtrl.addEventListener('click',()=>{
			this._closeItem();
		})	
		
		window.addEventListener('resize', functions.throttle((ev)=>{
			this.options.onResize(this);
		},10))
	}
	
	/** Open a grid item */
	private _openItem (ev: Event, item: HTMLElement) {
		if( this.isAnimating || this.isExpanded ) return;
		this.isAnimating = true;
		this.isExpanded = true;
		
		var gridImg = <HTMLImageElement>item.querySelector('img')
		var gridImgOffset = gridImg.getBoundingClientRect();
		
		this.current = this.items.indexOf(item);
		
		this._setOriginal(item.querySelector('a').getAttribute('href'));
		
		this.options.onOpenItem(this,item);
		
		this._setClone(gridImg.src,{
			width: gridImg.offsetWidth,
			height: gridImg.offsetHeight,
			left: gridImg.offsetLeft,
			top: gridImg.offsetTop
		});
		
		classie.add(item,'grid__item--current');
		
		var win = this._getWinSize();
		var originalSizeArr = item.getAttribute('data-size').split('x');
		var originalSize = {width: originalSizeArr[0], height: originalSizeArr[1]};
		var dx = dx = ((this.options.imgPosition.x > 0 ? 1-Math.abs(this.options.imgPosition.x) : Math.abs(this.options.imgPosition.x)) * win.width + this.options.imgPosition.x * win.width/2) - gridImgOffset.left - 0.5 * gridImg.offsetWidth,
		var	dy = ((this.options.imgPosition.y > 0 ? 1-Math.abs(this.options.imgPosition.y) : Math.abs(this.options.imgPosition.y)) * win.height + this.options.imgPosition.y * win.height/2) - gridImgOffset.top - 0.5 * gridImg.offsetHeight,
		var	z = Math.min( Math.min(win.width*Math.abs(this.options.imgPosition.x) - this.options.pagemargin, originalSize.width - this.options.pagemargin)/gridImg.offsetWidth, Math.min(win.height*Math.abs(this.options.imgPosition.y) - this.options.pagemargin, originalSize.height - 		this.options.pagemargin)/gridImg.offsetHeight );
		
		//Apply transformation to clone image
		this.cloneImg.style.webkitTransform = 'translate3d(' + dx + 'px, ' + dy + 'px, 0) scale3d(' + z + ', ' + z + ', 1)';
		this.cloneImg.style.transform = 'translate3d(' + dx + 'px, ' + dy + 'px, 0) scale3d(' + z + ', ' + z + ', 1)';
		
		// add a description if any	
		var descriptionEl = <HTMLElement>item.querySelector('.description');
		if( descriptionEl ) {
			this.previewDescriptionEl.innerHTML = descriptionEl.innerHTML;
		}
		
		setTimeout(()=> {
			classie.add(this.previewEl, 'preview--open');
			this.options.onExpand(this);
		}, 0);
		
		transitions.onEndTransition(this.cloneImg,()=>{
			imagesLoaded(this.originalImg,() =>{
				classie.add(this.previewEl, 'preview--image-loaded');
				this.originalImg.style.opacity = 1;
				transitions.onEndTransition(this.originalImg,()=>{
					this.cloneImg.style.webkitTransform
				})
			})
		})
}
}
	
	
