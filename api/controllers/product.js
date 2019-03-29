var prod = {
    sku:'02-Oil-123456789',  //-req //05-Oil-752940213
    name:'Oil Control', //-req
    desc: 'Mens Facewash',
    brand: 'Dove', 
    catg: "Beauty and Health", //-req
    weight: '90ml', 
    price: 75, //-req
    status: 'live', //-req
    sellMode: 'physical', //-req
    gstBracket: 18, //-req
    media: ['str1.png','str2.png'],
    colors: ['blue','green'],
    sizes: ['S','XS','L'], 
    childProds: [
        {
            id: '02-MIL-781191422',
            baseOffer: 2,
            free: 1
        },
        {
            id: '03-Soa-781215416',
            baseOffer: 1,
            free: 1
        }
    ]
};

var util = require('util');
var prodDb = [];
prodDb.push(prod);

const categories = {
    "Books": 1,
    "Beauty and Health": 2,
    "Grocery": 3,
    "Electronics and Appliances":4,
    "Fashion": 5,
    "Sports and Fitness": 6,
    "Home and Kitchen": 7,
    "Personal Hygiene": 8,
    "Others": 9
}

var catgProds = {
    "Books": [],
    "Beauty and Health": [{id: "02-Oil-123456789",name:"Oil Control"}],
    "Grocery": [],
    "Electronics and Appliances":[],
    "Fashion": [],
    "Sports and Fitness": [],
    "Home and Kitchen": [],
    "Personal Hygiene": [],
    "Others": []
}

module.exports = {
    getProd: getProd,
    addProd: addProd,
    getProdById: getById,
    updateById: updateProd,
    deleteById: delById,
    filterByCatg: filterCatg
    // getProdAttrs: getAttr
};

function genSKU(name, catg) {
    return util.format('%s-%s-%s', String(catg).padStart(2, '0'), name.substring(0,3), String(new Date().getTime()).substr(-9));
}

function getProd(req, res) {
    var pName = req.swagger.params.query.value;
    console.log(pName);
    if(pName) {
        var p = null;
        prodDb.find(function(pr,i) {
            if(pr.name.toLowerCase().indexOf(pName.toLowerCase()) !== -1 || pr.desc.toLowerCase().indexOf(pName.toLowerCase()) !== -1) {
                p = pr;
                console.log(pr.name.indexOf(pName));
                return true;
            }
        });
        if(p) {
            return res.status(200).json(p);
        } 
        return res.status(404).json({msg: 'No product found with name ' + pName});
    }
    else {
        const {sku, name, catg, price, status, sellMode, gstBracket, desc, brand, weight, colors,sizes} = prod;
        console.log(genSKU('MILK', 2), genSKU('Cok',3), {sku, name, catg, price, status, sellMode, gstBracket,colors});
        // return res.status(200).json({sku, name, catg, price, status, sellMode, gstBracket, colors,sizes});
        return res.status(200).json(prod);
    }
}

function addProd(req, res) {
    // var name = req.swagger.params.name.value;
    var p = req.swagger.params.product.value;
    if(p.name && p.catg && p.price && p.status && p.sellMode && p.gstBracket) {
        var exists = prodDb.find(function(pr,i) {
            if(pr.name === p.name && pr.price === p.price && pr.catg === p.catg && pr.brand === p.brand) {
                return true;
            }
        });
        if(exists) {
            return res.status(400).json({ id: '-1', message: 'Product with this name and brand already exist!!'});
        }
        p.sku = genSKU(p.name, categories[p.catg]);
        console.log(p);
        prodDb.push(p);
        catgProds[p.catg].push({id: p.sku, name: p.name});
        console.log(catgProds);
        return res.status(200).json({ id: p.sku, message: 'Added Successfully'});
    }
    return res.status(400).json({ id: '-1', message: 'Operation Failed!!'});
}

function findProd(pid) {
    var Idx = -1;
    prodDb.find(function(pr,i) {
        if(pr.sku === pid) {
            Idx = i;
            return true;
        }
    });
    return Idx;
}

function updateProd(req, res) {
    var id = req.swagger.params.prodID.value;
    var p = req.swagger.params.product.value;
    console.log(id,p);
    var prodIdx = findProd(id);
    // var ProdExists = prodDb.find(function(pr,i) {
    //     if(pr.sku === id) {
    //         prodIdx = i;
    //         return true;
    //     }
    // });
    if(prodIdx != -1) {
        console.log("before updation",prodDb[prodIdx]);
        Object.keys(prod).forEach(key => {
            if(p[key] == null || (Array.isArray(p[key]) && p[key].length == 0))  {
                // if((key ==='media' || key ==='colors' || key ==='sizes' || key ==='childProds') && p[key].length != 0)
                console.log(key, " not found"); 
            }
            else{
                prodDb[prodIdx][key] = p[key];
            }
        });
        console.log("after updation",prodDb[prodIdx]);
        return res.status(200).json(prodDb[prodIdx]);
    }
    else{
        return res.status(404).json({msg: 'No product found with id ' + id});
    }
}

function delById(req,res) {
    var pid = req.swagger.params.prodID.value;
    var prodIdx;
    if (pid == null) {
        return res.status(500).json({ id: -1, message: 'Please enter ProdID'});
    }
    var prodIdx = findProd(pid);
    if(prodIdx != -1) {
        var x = prodDb[prodIdx];
        var catgIdx = -1;
        catgProds[x.catg].find(function(p,i) {
            if(p.id===x.sku && p.name===x.name) {
                catgIdx = i;
                return true;
            }
        });
        console.log("Deleting Catg Product at Idx:",catgIdx);
        if(catgIdx != -1){
            catgProds[x.catg].splice(catgIdx,1);
            console.log("After deletion categProds:\n",catgProds);
        }
        prodDb.splice(prodIdx,1);
        
        return res.status(200).json({ id: pid, message: 'Product Deleted'});
    }
    else {
        return res.status(404).json({ msg: 'No product found with id ' + pid});
    }
}

function getById(req,res) {
    var pid = req.swagger.params.prodID.value;
    if (pid == null) {
        return res.status(500).json({ id: -1, message: 'Please enter ProdID'});
    }
    var prodIdx = findProd(pid);
    if(prodIdx != -1) {
        return res.status(200).json(prodDb[prodIdx]);
    }
    else {
        return res.status(404).json({ msg: 'No product found with id ' + pid});
    }
}

function filterCatg(req,res) {
    var catgs = req.swagger.params.filters.value;
    if (catgs && catgs.length != 0) {
        var catgRep = {};
        catgs.forEach(c => {
            catgRep[c] = catgProds[c];
        });
        console.log(catgRep);
        return res.status(200).json(catgRep);
    }
    return res.status(200).json(catgProds);
}

function getAttr(req,res) {
    var pid = req.swagger.params.prodID.value;
    var variations = req.swagger.params.attributes.value;
    if (pid == null) {
        return res.status(500).json({ id: -1, message: 'Please enter ProdID'});
    }
    var prodIdx = findProd(pid);
    return res.status(404).json({msg: 'Please enter ProdID'});
}

