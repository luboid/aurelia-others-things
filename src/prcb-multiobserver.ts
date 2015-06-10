
import {ObserverLocator} from 'aurelia-framework'; // or 'aurelia-binding'
import {inject} from 'aurelia-dependency-injection';

export interface IChangedPropertyCallback {
    (propertyName:string, newValue:any, oldValue:any, source:any):void;
}

@inject(ObserverLocator)
export class MultiObserver {
  constructor(private observerLocator:ObserverLocator) {
  }

  observeObjectProperties(object, callback:IChangedPropertyCallback) {//:string[]|any
    var subscriptions = [], internalCallback = (propertyName, source) => {
        return (newValue, oldValue) => {
          callback(propertyName, newValue, oldValue, source);
        }
    };

    for(var propertyName in object) {
      subscriptions
        .push(
          this.observerLocator
            .getObserver(object, propertyName)
            .subscribe(internalCallback(propertyName, object)));
    }

    // return dispose function
    return () => {
      while(subscriptions.length) {
        subscriptions.pop()();
      }
    }
  }

  observeProperties(properties, callback:IChangedPropertyCallback) {//:string[]|any
    var subscriptions = [], object, internalCallback = (propertyName, source) => {
        return (newValue, oldValue) => {
          callback(propertyName, newValue, oldValue, source);
        }
    };

    for(var propertyName in properties) {
      object = properties[propertyName];
      subscriptions.push(
        this.observerLocator
          .getObserver(object, propertyName)
          .subscribe(internalCallback(propertyName, object)));
    }

    // return dispose function
    return () => {
      while(subscriptions.length) {
        subscriptions.pop()();
      }
    }
  }
}
