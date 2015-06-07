# aurelia-others-things
Other Aurelia things, like open common ViewModel with custom jQuery dialog pugin


```javascript
@inject(PrcbWindow)
export class Edit {
    constructor(private window:PrcbWindow) {
    }

    openWindow() {
	  // var a = this.window.show('./viewmodels/dialog', {title: 'Edit ViewModel title ...'});
      var a = this.window.show({viewModel:'./viewmodels/dialog', model: {args0:1,args1:2}}, {title: 'Edit ViewModel title ...'});

      a.promise.then((result:{result:string}) => {
		//...
        },(result:string) => {
		//...
        });
    }
}


@inject(PrcbWindow)
export class Dialog {
    constructor(private window:PrcbWindow) {
    }

    closeWindow() {
	  this.window.close(this, {value: '1234'});// close and return value ...
    }
}
```