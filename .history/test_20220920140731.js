

let lst = [];
let sett = new Set();
for(let i = 0; i < 5; i++) {
    rand = Math.floor(Math.random() * 1000);
    lst.push(rand);
    sett.add(rand);
}
for(let i = 0; i < 1000; i++) {
    
}
console.log(lst);
console.log(sett);