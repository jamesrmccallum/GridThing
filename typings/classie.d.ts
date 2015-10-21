
declare module classie {

type ElementSelector = Element | NodeList | Array<Element>;

	export interface has{
		(HtmlElement,string):boolean; 
	}
	
	export interface add {
		(HTMLElement,string): void;
	} 
	
	export interface remove {
		(HTMLElement, string): void;
	}
	
	export interface toggle {
		(HTMLElement, string):void 
	}
	
}

declare module 'classie' {
	export = classie;
}