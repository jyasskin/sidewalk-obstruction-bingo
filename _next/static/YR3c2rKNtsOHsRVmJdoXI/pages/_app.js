(window.webpackJsonp=window.webpackJsonp||[]).push([[5],{0:function(e,t,n){n("ho59"),e.exports=n("nOHt")},L1EO:function(e,t,n){},cha2:function(e,t,n){"use strict";n.r(t),n.d(t,"default",(function(){return W}));n("q4sD");var r=n("q1tI"),o=n.n(r),a=n("/MKj"),i=n("o0o1"),c=n.n(i),s=n("HaE+"),u=n("ODXe");const d=(e,t)=>t.some(t=>e instanceof t);let f,l;const b=new WeakMap,p=new WeakMap,v=new WeakMap,h=new WeakMap,g=new WeakMap;let m={get(e,t,n){if(e instanceof IDBTransaction){if("done"===t)return p.get(e);if("objectStoreNames"===t)return e.objectStoreNames||v.get(e);if("store"===t)return n.objectStoreNames[1]?void 0:n.objectStore(n.objectStoreNames[0])}return D(e[t])},set:(e,t,n)=>(e[t]=n,!0),has:(e,t)=>e instanceof IDBTransaction&&("done"===t||"store"===t)||t in e};function w(e){return e!==IDBDatabase.prototype.transaction||"objectStoreNames"in IDBTransaction.prototype?(l||(l=[IDBCursor.prototype.advance,IDBCursor.prototype.continue,IDBCursor.prototype.continuePrimaryKey])).includes(e)?function(...t){return e.apply(j(this),t),D(b.get(this))}:function(...t){return D(e.apply(j(this),t))}:function(t,...n){const r=e.call(j(this),t,...n);return v.set(r,t.sort?t.sort():[t]),D(r)}}function y(e){return"function"===typeof e?w(e):(e instanceof IDBTransaction&&function(e){if(p.has(e))return;const t=new Promise((t,n)=>{const r=()=>{e.removeEventListener("complete",o),e.removeEventListener("error",a),e.removeEventListener("abort",a)},o=()=>{t(),r()},a=()=>{n(e.error||new DOMException("AbortError","AbortError")),r()};e.addEventListener("complete",o),e.addEventListener("error",a),e.addEventListener("abort",a)});p.set(e,t)}(e),d(e,f||(f=[IDBDatabase,IDBObjectStore,IDBIndex,IDBCursor,IDBTransaction]))?new Proxy(e,m):e)}function D(e){if(e instanceof IDBRequest)return function(e){const t=new Promise((t,n)=>{const r=()=>{e.removeEventListener("success",o),e.removeEventListener("error",a)},o=()=>{t(D(e.result)),r()},a=()=>{n(e.error),r()};e.addEventListener("success",o),e.addEventListener("error",a)});return t.then(t=>{t instanceof IDBCursor&&b.set(t,e)}).catch(()=>{}),g.set(t,e),t}(e);if(h.has(e))return h.get(e);const t=y(e);return t!==e&&(h.set(e,t),g.set(t,e)),t}const j=e=>g.get(e);const E=["get","getKey","getAll","getAllKeys","count"],I=["put","add","delete","clear"],O=new Map;function B(e,t){if(!(e instanceof IDBDatabase)||t in e||"string"!==typeof t)return;if(O.get(t))return O.get(t);const n=t.replace(/FromIndex$/,""),r=t!==n,o=I.includes(n);if(!(n in(r?IDBIndex:IDBObjectStore).prototype)||!o&&!E.includes(n))return;const a=async function(e,...t){const a=this.transaction(e,o?"readwrite":"readonly");let i=a.store;r&&(i=i.index(t.shift()));const c=await i[n](...t);return o&&await a.done,c};return O.set(t,a),a}m=(e=>({...e,get:(t,n,r)=>B(t,n)||e.get(t,n,r),has:(t,n)=>!!B(t,n)||e.has(t,n)}))(m);var k=n("uFh9"),L=n("9LU2"),S=n("i7Pf"),x=Object(S.c)({name:"db",initialState:{state:"loading"},reducers:{setDb:function(e,t){return{state:"ready",db:t.payload}}}}),P=x.actions.setDb,A=x.reducer,T=o.a.createElement;function C(e){var t=e.initialKeyvalsForTest,n=void 0===t?void 0:t,i=Object(a.b)();return Object(r.useEffect)((function(){var e=!0,t=function(e,t,{blocked:n,upgrade:r,blocking:o,terminated:a}={}){const i=indexedDB.open(e,t),c=D(i);return r&&i.addEventListener("upgradeneeded",e=>{r(D(i.result),e.oldVersion,e.newVersion,D(i.transaction))}),n&&i.addEventListener("blocked",()=>n()),c.then(e=>{a&&e.addEventListener("close",()=>a()),o&&e.addEventListener("versionchange",()=>o())}).catch(()=>{}),c}("sidewalk-obstruction-bingo",1,{upgrade:function(e,t,r,o){switch(t){case 0:var a=e.createObjectStore("queuedReports",{keyPath:"uuid"});if(a.createIndex("tile","tile"),a.createIndex("addTime","addTime"),e.createObjectStore("keyval"),void 0!==n)for(var i=0,c=Object.entries(n);i<c.length;i++){var s=Object(u.a)(c[i],2),d=s[0],f=s[1];o.objectStore("keyval").add(f,d)}}},blocking:function(){t.then((function(e){return e.close()})),location.reload()}});function r(){return(r=Object(s.a)(c.a.mark((function n(){var r,o,a,s,d;return c.a.wrap((function(n){for(;;)switch(n.prev=n.next){case 0:return n.next=2,t;case 2:return r=n.sent,n.next=5,Promise.all([Object(L.b)(r),Object(k.c)(r)]);case 5:o=n.sent,a=Object(u.a)(o,2),s=a[0],d=a[1],e&&(i(P(r)),i(s),i(d));case 10:case"end":return n.stop()}}),n)})))).apply(this,arguments)}return function(){r.apply(this,arguments)}(),function(){e=!1,t.then((function(e){return e.close()}))}}),[i,n]),T(o.a.Fragment,null)}function M(e){return function(e){if(Array.isArray(e)){for(var t=0,n=new Array(e.length);t<e.length;t++)n[t]=e[t];return n}}(e)||function(e){if(Symbol.iterator in Object(e)||"[object Arguments]"===Object.prototype.toString.call(e))return Array.from(e)}(e)||function(){throw new TypeError("Invalid attempt to spread non-iterable instance")}()}var N=n("ANjH"),_=Object(N.c)({db:A,config:L.a,board:k.a});var q=Object(S.a)({reducer:_,middleware:M(Object(S.d)({immutableCheck:{ignoredPaths:["db.db"]},serializableCheck:{ignoredActions:["db/setDb"],ignoredPaths:["db.db"]}}))}),K=(n("L1EO"),o.a.createElement);function W(e){var t=e.Component,n=e.pageProps;return K(a.a,{store:q},K(C,null),K(t,n))}},ho59:function(e,t,n){(window.__NEXT_P=window.__NEXT_P||[]).push(["/_app",function(){return n("cha2")}])},q4sD:function(e,t,n){}},[[0,1,2,0,3,4]]]);