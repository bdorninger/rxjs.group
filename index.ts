import './style.css';

import { of, map, Subject, from } from 'rxjs';
import {
  window,
  groupBy,
  bufferCount,
  mergeWith,
  count,
  buffer,
  tap,
  bufferWhen,
  mergeAll
} from 'rxjs/operators';

interface MyMap {
  [key: string]: string;
}

interface Params {
  view?: string;  
}

const p :Params = { foo:'bar'};

const mymap = {
  foo: 'abc',
  bar: 'fd',
  bak: 'qtr'
}

console.log(mymap[Object.getOwnPropertyNames(mymap)[0]])

const bufsize = 4;

const flushers: Subject<void>[] = [];
function flushAll() {
  flushers.forEach(f => f.next());
}

const source$ = new Subject<{ s: number; t: number }>();

const data = [
  { s: 3, t: 1 },
  { s: 4, t: 1 },
  { s: 5, t: 1 },
  { s: 8, t: 1 },
  { s: 44, t: 2 },
  { s: 55, t: 2 }
];
const groups = source$.pipe(
  groupBy(obj => {
    // console.log('', obj);
    return obj.t;
  })
);
// const bufferedG=groups.pipe(bufferCount(3))
// groups.pipe(bufferCount(2)).forEach(v => v.forEach(vv => vv))
const all$ = new Subject<any>();
groups.forEach(g$ => {
  let cnt = 0;
  let buf = 0;
  const flush$ = new Subject<void>();
  flushers.push(flush$);

  all$.next(
    g$.pipe(
      tap(v => {
        ++cnt;
        ++buf;
        if (buf % (bufsize + 1) === 0) {
          console.log(
            `g${g$.key} entry ${cnt} flushed the buffer: bufsize (${bufsize})`
          );
          flush$.next();
          buf = 1;
        }
        //console.log(cnt,buf,bufsize,v)
        return v;
      }),
      bufferWhen(() => flush$)
    )
  );
});

all$.pipe(mergeAll()).subscribe(obj => console.log(`out: `, obj));

data.forEach(obj => {
  source$.next(obj);
});

source$.next({ s: 99, t: 2 });
source$.next({ s: 199, t: 2 });
source$.next({ s: 299, t: 2 });

console.log('Completing/Flushall');
// flushAll();
setTimeout(() => source$.complete(), 10);
