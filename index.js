let inputeq = document.getElementById("eqin")
let used = false
let ptable;
fetch('https://raw.githubusercontent.com/Bowserinator/Periodic-Table-JSON/refs/heads/master/PeriodicTableJSON.json')
.then(response => response.json())
.then(data => {
    ptable = data.elements
})

function calculate(){
    document.getElementById('boxes').innerHTML = ''
    //balancing
    let res = chemicalEquationBalancer(inputeq.textContent).text
    res = res.replace('=', '→')
    inputeq.textContent = res
    //for boxes, not balancing
    let input = inputeq.textContent
    input = input.replace(/\s/g, "") //remove all spaces
    input = input.split("→")
    let reactants = input[0]
    let products = input[1]
    reactants = reactants.split("+")
    products = products.split("+")
    reactants.forEach(element => {
        addbox(element)
    });
    products.forEach(element => {
        addbox(element)
        document.getElementById('boxes').lastChild.classList.add('product')
    });

    // limiting reactant
    const num_str = "0123456789";
    let rcoeffs = []
    reactants.forEach(element => {
        let coeff = 1
        if(num_str.includes(element.charAt(0))){ // if there is coefficient
            coeff = element.match(/\d+(\.\d+)?/g); 
            coeff = coeff[0]
        }
        rcoeffs.push(coeff)
    });
    let pcoeffs = []
    products.forEach(element => {
        let coeff = 1
        if(num_str.includes(element.charAt(0))){ // if there is coefficient
            coeff = element.match(/\d+(\.\d+)?/g); 
            coeff = coeff[0]
        }
        pcoeffs.push(coeff)
    });
    function limiting(){
        if(document.getElementById('boxes').innerHTML !== ''){
            document.querySelectorAll('.limiting').forEach(e => e.classList.remove('limiting'));
            document.querySelectorAll('.excess').forEach(e => e.classList.remove('excess'));
            let boxes = document.getElementsByClassName('box')
            let rboxes = Array.from(boxes).slice(0, rcoeffs.length) // only reactants
            let pboxes = Array.from(boxes).slice(rcoeffs.length) // only products
            let count = 0
            let narray = []
            for(const box of rboxes){
                nmol = box.lastChild.value // empty value is ''
                narray.push(nmol/rcoeffs[count]) // n = moles / coeff
                count++
            }
            // form array of n values, find lowest, if '' is in array, make lowest -1
            let lowest = 0
            narray.forEach(n => {
                const regex = /^\d*\.?\d+$/;
                if(regex.test(n)){ // if n is number (can have one period)
                    if(n > 0){
                        if(lowest > 0){ // if there is actually a lowest
                            if(n < lowest){
                                lowest = n
                            }
                        } else if (lowest === 0){ // if lowest isnt set yet
                            lowest = n
                        } 
                    } else{
                        lowest = -1
                    } 
                } else{
                    lowest = -1
                }
            })
            // any index in narray that has value lowest is limiting
            indexarr = []
            narray.forEach((value, index) => {
                if(lowest > 0){ // if all mol values are set
                    if(value == lowest){
                        indexarr.push(index)
                    }
                }
            })
            for(let i = 0; i < rboxes.length; i++){
                if(lowest > 0){ // if all mol values are set
                    if(indexarr.includes(i)){
                        rboxes[i].classList.remove('excess')
                        rboxes[i].classList.add('limiting')
                    } else{
                        rboxes[i].classList.add('excess')
                    }
                }
            }
            let coeffcount = 0
            for(const box of pboxes){
                if(lowest > 0){ // if all mol values are set
                    //children[2] is molar mass input
                    //children[4] is mass input
                    box.lastChild.value = pcoeffs[coeffcount] * lowest // number of moles
                    box.children[4].value = box.lastChild.value * box.children[2].value
                    coeffcount++
                } else{
                    box.lastChild.value = ''
                    box.children[4].value = ''
                }
            }
            setTimeout(limiting, 100)
        }
    }
    limiting()
}

function addbox(element){
    const boxdiv = document.createElement('div')
    boxdiv.classList.add('box') // class box (.box) in css

    const elementname = document.createElement('h3')
    elementname.textContent = element

    //molarmass
    const molarmass = document.createElement('input')
    molarmass.type = 'number'
    molarmass.placeholder = 'insert number'
    molarmass.id = 'molarmass' + element
    // calculate molar mass, accounting for products that are not just one element and elements with a substring
    
    let sum = 0
    let mmcalc = element.split(/(?=[A-Z])/); // split at each capital letter
    const num_str = "0123456789"; // string of all numbers
    if(num_str.includes(mmcalc[0].charAt(0))){ // if there is a coefficient (always first spot possible)
        mmcalc.splice(0, 1)
    }
    mmcalc.forEach(i => {
        let mult = 1
        while(num_str.includes(i.charAt(i.length - 1))){
            mult = i.charAt(i.length - 1)
            i = i.substring(0, i.length - 1)
        }
        sum += (ptable.find(el => el.symbol === i).atomic_mass * mult)
    });
    molarmass.value = parseFloat(sum.toFixed(4)) // remove trailing 0's and limit to 4 decimal points 

    const labelmolarmass = document.createElement('label')
    labelmolarmass.htmlFor = molarmass.id
    labelmolarmass.textContent = 'MM (g/mol):'

    //mass
    const mass = document.createElement('input')
    mass.type = 'number'
    mass.placeholder = 'insert number'
    mass.id = 'mass' + element

    const labelmass = document.createElement('label')
    labelmass.htmlFor = mass.id
    labelmass.textContent = 'Mass (g):'

    // number of moles
    const nmol = document.createElement('input')
    nmol.type = 'number'
    nmol.placeholder = 'insert number'
    nmol.id = 'nmol' + element

    const labelnmol = document.createElement('label')
    labelnmol.htmlFor = nmol.id
    labelnmol.textContent = 'n (mol):'

    // mass & nmol events
     mass.addEventListener('input', function(event){
        if(event.target.value !== ''){
            nmol.value = parseFloat((event.target.value / molarmass.value).toFixed(4))
        } else{
            nmol.value = ''
        }
        
    })

    nmol.addEventListener('input', function(event){
        if(event.target.value !== ''){
            mass.value = parseFloat((event.target.value * molarmass.value).toFixed(4))
        } else{
            mass.value = ''
        }
    })

    //add box
    boxdiv.append(elementname)

    boxdiv.append(labelmolarmass)
    boxdiv.append(molarmass)

    boxdiv.append(labelmass)
    boxdiv.append(mass)

    boxdiv.append(labelnmol)
    boxdiv.append(nmol)

    document.getElementById('boxes').append(boxdiv)
}

inputeq.addEventListener("keydown", function (e) {
    document.getElementById('boxes').innerHTML = ''
    if(!used){
        const range = document.createRange();
        range.selectNodeContents(inputeq);

        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    }
    used = true
});

function addsub(){
    document.getElementById('boxes').innerHTML = ''
    let num = prompt("Insert number")
    let sub = document.createElement("sub")
    sub.setAttribute("contenteditable", "false")
    sub.textContent = num
    inputeq.appendChild(sub)
}

function addsup(){
    document.getElementById('boxes').innerHTML = ''
    let num = prompt("Insert charge")
    let sup = document.createElement("sup")
    sup.setAttribute("contenteditable", "false")
    sup.textContent = num
    inputeq.appendChild(sup)
}

function addarrow(){
    document.getElementById('boxes').innerHTML = ''
    if(!inputeq.textContent.includes("→")){
        inputeq.append("→")
    }
}

// code for chemical balancing, not made by me
// source: https://github.com/zukahai/npm-chemical-equation-balancer/blob/main/index.js
function chemicalEquationBalancer(str){
    let text = 'Please double check your chemical equation'
    let success = true;
    try {
        //remove space
        str = str.replaceAll(' ','');
        str = str.replaceAll('->','=');
        str = str.replaceAll('→','=');
        //get left right
        let left = str.split('=')[0];
        let right = str.split('=')[1];

        left = left.split('+');
        right = right.split('+');

        const dataLeft = {};
        for (let x in left) {
            dataLeft[left[x]] = componentAnalysis(left[x]);
        }

        const dataRight = {};
        for (let x in right) {
            dataRight[right[x]] = componentAnalysis(right[x]);
        }

        const element_HH = {}
        for (let x in dataLeft) {
            for (let y in dataLeft[x]) {
                element_HH[y] = 0;
            }
        }
        let N = left.length + right.length;
        let M = 0;
        for (let x in element_HH) {
            M++;
        }

        let arr = initArray(N, M);

        let i = 0;
        for (let x in element_HH) {
            let j = 0;
            for (let y in dataLeft) {
                arr[i][j++] = (dataLeft[y][x] == null ? 0 : dataLeft[y][x]);
            }
            for (let y in dataRight) {
                arr[i][j++] = (dataRight[y][x] == null ? 0 : -dataRight[y][x]);
            }
            i++;
        }
        // console.log("arr", arr);
        arr = ladderMatrix(arr);
        // console.log("arr1", arr);
        arr = diagonalMatrix(arr);
        // console.log("arr2", arr);
        let result_array = getResultArray(arr);
        i = 0;
        const resultLeft = {};
        for (let y in dataLeft) {
            resultLeft[y] = result_array[i++]
        }
        const resultRight = {};
        for (let y in dataRight) {
            resultRight[y] = result_array[i++]
        }

        i = 0;
        for (let x in dataLeft) {
            for (let y in dataLeft[x]) {
                element_HH[y] += result_array[i] * dataLeft[x][y];
            }
            i++;
        }
        text = "";
        for (let x in resultLeft) {
            if (resultLeft[x] == null || resultLeft[x] <= 0)
                success = false;
            text = text + ((resultLeft[x] > 1) ? resultLeft[x] : "") + x + " + ";
        }
        text = text.substring(0, text.length - 3);
        text = text + " = ";
        for (let x in resultRight) {
            if (resultRight[x] == null || resultRight[x] <= 0)
                success = false;
            text = text + ((resultRight[x] > 1) ? resultRight[x] : "") + x + " + ";
        }
        text = text.substring(0, text.length - 3);
        if (!success)
            text = 'Please double check your chemical equation'
        return {
            success: success,
            input:str,
            left: left,
            right: right,
            element: element_HH,
            data: {
                dataLeft: dataLeft,
                dataRight: dataRight,
            },
            result: {
                resultLeft: resultLeft,
                resultRight: resultRight,
            },
            text: text,
        }
    } catch (error) {
        return {
            success: false,
            text: text,
        }
    }
}

function componentAnalysis(str){
    str = str + "Z";
    //Fe2(SO4)3
    const data = {};
    let element = "";
    let quantity = "";
    for (let i = 0; i < str.length; i++) {
        if (str[i] >= '0' && str[i] <= '9') {
            quantity = quantity + str[i];
        } else if (str[i] >= 'A' && str[i] <= 'Z') {
            if (element.length > 0) {
                data[element] = ((typeof data[element] !== 'undefined') ? Math.floor(data[element]) : 0) +
                    ((quantity.length > 0) ? Math.floor(quantity) : 1);
                element = "";
                quantity = "";
            }
            element = element + str[i];
        } else if (str[i] >= 'a' && str[i] <= 'z') {
            element = element + str[i];
        } if (str[i] === '(') {
            if (element.length > 0)
                data[element] = ((typeof data[element] !== 'undefined') ? Math.floor(data[element]) : 0) +
                    ((quantity.length > 0) ? Math.floor(quantity) : 1);
            element = "";
            quantity = "";
            let count = 1;
            let str2 = "";
            i++;
            while(count > 0 && i < str.length) {
                if (str[i] === '(')
                    count++;
                if (str[i] === ')')
                    count--;
                if (count === 0)
                    break;
                str2 = str2 + str[i];
                i++;
            }
            i++;
            while(str[i] >= '0' && str[i] <= '9' && i < str.length){
                quantity = quantity + str[i++];
            }
            i--;
            if (quantity.length == 0)
                quantity = '1';
            let sub_data = componentAnalysis(str2);
            for (let x in sub_data) {
                data[x] = ((data[x] != null) ? data[x] : 0) +
                    Math.floor(sub_data[x]) * Math.floor(quantity);
            }
            element = "";
            quantity = "";
        }
    }
    return data;
}
function initArray(N, M) {
    let arr = [];
    for (let i = 0; i < M; i++) {
        arr[i] = [];
        for (let j = 0; j < N; j++) {
            arr[i][j] = 0;
        }
    }
    return arr;
}

function ladderMatrix(arr) {
    let M = arr.length;
    let N = arr[0].length;
    for (let i = 0; i < M - 1; i++) {
        let indexNotZero = i;
        for (let j = i; j < M; j++) {
            if (arr[j][i] != 0) {
                let temp = arr[indexNotZero];
                arr[indexNotZero] = arr[j];
                arr[j] = temp;
                indexNotZero++;
            }
        }
        for (let j = i; j < M; j++) {
            if (arr[j][i] < 0)
                for (let k = i; k < N; k++) {
                    arr[j][k] *= -1;
                }
        }
        for (let j = i + 1; j < M; j++) {
            if (arr[j][i] == 0)
                break;
            let lcm = lcmTwoNumbers(arr[i][i], arr[j][i]);
            let k1 = lcm / arr[j][i];
            let k2 = lcm / arr[i][i];
            for (let k = 0; k < N; k++) {
                arr[i][k] *= k2
                arr[j][k] *= k1;
            }
            for (let k = 0; k < N; k++) {
                arr[j][k] -= arr[i][k];
            }
        }
    }
    for (let i = M - 1; i >= 0; i--) {
        let checkRowZero = true;
        for (let j = 0; j < N; j++) {
            if (arr[i][j] !== 0){
                checkRowZero = false;
                break;
            }
        }
        if (checkRowZero)
            arr.splice(i, 1);
    }
    return arr;
}

function  diagonalMatrix(arr) {
    let M = arr.length;
    let N = arr[0].length;
    for (let i = M - 1; i >= 0; i--) {
        for (let j = i - 1; j >= 0; j--) {
            if (arr[j][i] == 0)
                continue;
            let lcm = lcmTwoNumbers(arr[i][i], arr[j][i]);
            let k1 = lcm / arr[j][i];
            let k2 = lcm / arr[i][i];
            for (let k = 0; k < N; k++) {
                arr[i][k] *= k2
                arr[j][k] *= k1;
            }
            for (let k = 0; k < N; k++) {
                arr[j][k] -= arr[i][k];
            }
        }
    }
    return arr;
}

function getResultArray(arr) {
    let M = arr.length;
    let N = arr[0].length;
    let result = [];
    let lcm = 1;
    for (let i = 0; i < M; i++) {
       lcm = lcmTwoNumbers(lcm, arr[i][i])
    }
    lcm = Math.abs(lcm);
    result[N - 1] = lcm;
    for (let i = M - 1; i >= 0; i--) {
        result[i] = (-lcm * arr[i][N - 1]) / arr[i][i];
    }
    let gcd = result[0];
    for (let i = 0; i < N; i++) {
        gcd = gcdTwoNumbers(gcd, result[i]);
    }
    for (let i = 0; i < N; i++) {
        result[i] /= gcd;
    }
    return result;
}

function lcmTwoNumbers(x, y) {
    if ((typeof x !== 'number') || (typeof y !== 'number'))
        return false;
    return (!x || !y) ? 0 : ((x * y) / gcdTwoNumbers(x, y));
}

function gcdTwoNumbers(x, y) {
    x = Math.abs(x);
    y = Math.abs(y);
    while(y) {
        var t = y;
        y = x % y;
        x = t;
    }
    return x;
}