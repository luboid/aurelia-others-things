# aurelia-others-things
Other Aurelia things, like open common ViewMode with custom jQuery dialog pugin


```javascript
@inject(PrcbWindow)
export class Edit {
    constructor(private window:PrcbWindow) {
    }

    openWindow() {
      var a = this.window.show('./viewmodels/dialog', {title: 'Edit ViewModel title ...'});

      a.promise.then((result:{result:string}) => {
		//...
        },(result:string) => {
		//...
        });
    }
}
```