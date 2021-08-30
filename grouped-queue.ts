import { bufferWhen, groupBy, mergeAll, Observable, Subject, tap } from "rxjs";

export class GroupedQueue<S,G,R> {

  private flush$: Subject<void> = new Subject();
  private queue$: Subject<S>

  constructor(public readonly bufsize:number) {

  }

  public enqueue(value: S) {
    this.queue$.next(value);
  }

  public get grouped$(groupFn: (val:S)=>G): Observable<S[]> {
    const groups = this.queue$.pipe(
      groupBy(obj => {
        // console.log('', obj);
        return groupFn;
      })
    );
    groups.forEach(g$ => {        
      let cnt = 0;
      g$.pipe(
        tap(v => {
          console.log(++cnt);
          if(cnt/this.bufsize===1) {
            this.flush$.next();        
          }
          return v;
        }),
        bufferWhen(()=> this.flush$),
        mergeAll()
      )
    });
  }

}