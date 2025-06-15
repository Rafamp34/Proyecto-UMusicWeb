import { Directive, ElementRef, EventEmitter, HostListener, Input, Output, Renderer2 } from '@angular/core';

@Directive({
    selector: '[appDragDrop]'
    })
export class DragDropDirective {
    @Input() appDragDropData: any;
    @Input() appDragDropIndex: number = -1;
    @Output() itemDropped = new EventEmitter<{item: any, targetIndex: number, sourceIndex: number}>();
    
    private isDragging = false;
    
    constructor(private el: ElementRef, private renderer: Renderer2) {
        this.renderer.setAttribute(this.el.nativeElement, 'draggable', 'true');
    }
    
    @HostListener('dragstart', ['$event'])
    onDragStart(event: DragEvent) {
        this.isDragging = true;
        const data = {
        item: this.appDragDropData,
        index: this.appDragDropIndex
        };
        
        event.dataTransfer?.setData('text', JSON.stringify(data));
        
        this.renderer.addClass(this.el.nativeElement, 'dragging');
        
        if (this.appDragDropData?.image?.url) {
        const img = new Image();
        img.src = this.appDragDropData.image.url;
        img.width = 50;
        event.dataTransfer?.setDragImage(img, 25, 25);
        }
    }
    
    @HostListener('dragend')
    onDragEnd() {
        this.isDragging = false;
        this.renderer.removeClass(this.el.nativeElement, 'dragging');
    }
    
    @HostListener('dragover', ['$event'])
    onDragOver(event: DragEvent) {
        if (event.preventDefault) {
        event.preventDefault();
        }
        
        this.renderer.addClass(this.el.nativeElement, 'drag-over');
        
        return false;
    }
    
    @HostListener('dragleave')
    onDragLeave() {
        this.renderer.removeClass(this.el.nativeElement, 'drag-over');
    }
    
    @HostListener('drop', ['$event'])
    onDrop(event: DragEvent) {
        event.preventDefault();
        if (event.stopPropagation) {
        event.stopPropagation();
        }
        
        this.renderer.removeClass(this.el.nativeElement, 'drag-over');
        
        if (!this.isDragging) {
        try {
            const dataStr = event.dataTransfer?.getData('text');
            if (dataStr) {
            const data = JSON.parse(dataStr);
            
            this.itemDropped.emit({
                item: data.item, 
                targetIndex: this.appDragDropIndex,
                sourceIndex: data.index
            });
            }
        } catch (err) {
            console.error('Error al procesar datos de arrastre:', err);
        }
        }
        
        return false;
    }
}