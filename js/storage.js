const DB='okashi-world', VERSION=1;
let dbPromise;
export function openDB(){
  if(!dbPromise)dbPromise=new Promise((resolve,reject)=>{
    const req=indexedDB.open(DB,VERSION);
    req.onupgradeneeded=()=>{const db=req.result;db.createObjectStore('houses',{keyPath:'id'});db.createObjectStore('state');};
    req.onsuccess=()=>{req.result.onversionchange=()=>{req.result.close();dbPromise=null;};resolve(req.result);};
    req.onerror=()=>{dbPromise=null;reject(req.error);};
    req.onblocked=()=>{dbPromise=null;reject(new Error('ほかの画面を閉じて、もう一度お試しください。'));};
  });
  return dbPromise;
}
async function transaction(store, mode, action){
  const db=await openDB();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(store,mode);let result;
    const req=action(tx.objectStore(store));
    req.onsuccess=()=>{result=req.result;};
    tx.oncomplete=()=>resolve(result);
    tx.onerror=()=>reject(tx.error||req.error||new Error('保存できませんでした'));
    tx.onabort=()=>reject(tx.error||new Error('保存を完了できませんでした'));
  });
}
export const getState=key=>transaction('state','readonly',s=>s.get(key));
export const setState=(key,value)=>transaction('state','readwrite',s=>s.put(value,key));
export const saveHouse=house=>transaction('houses','readwrite',s=>s.put(house));
export const getHouses=()=>transaction('houses','readonly',s=>s.getAll());
