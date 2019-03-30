var util = require('util');

//sample product
var prod = {
    name:'Cool Talc',           //-req
    desc: 'Sea Minerals',
    brand: 'Wild Stone',
    catg: "Beauty and Health",  //-req
    weight: '90g', 
    price: 75,                  //-req
    status: 'live',             //-req
    sellMode: 'physical',       //-req
    media: ['str1.png','str2.png'],
    colors: ['blue','green'],
    sizes: ['S','L'], 
    offers: [
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
    ],
    gstBracket: 18, 
    sku:'02-Coo-123456789',  //-req
};

var prodDb = [];
prodDb.push(prod);

//all categories ids and gst slabs
const categories = {
    "Books": {id:1, gst:12},
    "Beauty and Health": {id:2, gst:18},
    "Grocery": {id:3, gst:5},
    "Electronics and Appliances": {id:4, gst:28},
    "Fashion": {id:5, gst:18},
    "Sports and Fitness": {id:6, gst:12},
    "Home and Kitchen": {id:7, gst:12},
    "Personal Hygiene": {id:8, gst:5},
    "Others": {id:9, gst:18},
}

//product belonging to specific categories
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
    filterByCatg: filterCatg,
    getAllOfferProduct: getOffers
};

//generates SKU for a prod by taking catgId(2) - name(2,3) - timestamp(9)
function genSKU(name, catg) {
    return util.format('%s-%s-%s', String(catg).padStart(2, '0'), name.substring(0,3), String(new Date().getTime()).substr(-9));
}

//used to get all prods (filters also can be applied)
function getProd(req, res) {
    var pName = req.swagger.params.keywords.value;
    var pBrand = req.swagger.params.brand.value;
    var pCatg = req.swagger.params.category.value;
    var pStatus = req.swagger.params.status.value;
    if(pName || pCatg || pBrand || pStatus) {
        var resArray = [];
        prodDb.find(function(pr,i) {
            var valid = true;
            if(pName) {
                if(pr.name.toLowerCase().indexOf(pName.toLowerCase()) !== -1 
                    || pr.desc.toLowerCase().indexOf(pName.toLowerCase()) !== -1) {
                    valid = true;
                }
                else
                    valid = false;
            }
            if(valid && pBrand && pBrand.length != 0) {
                if(pBrand.find(b => pr.brand.toLowerCase().indexOf(b.toLowerCase()) !== -1)) {
                    valid = true;
                }
                else
                    valid = false;
            }
            if(valid && pCatg && pCatg.length != 0) {
                if(pCatg.find(c => c === pr.catg)) {
                    valid = true;
                }
                else
                    valid = false;
            }
            if(valid && pStatus && pStatus.length != 0) {
                if(pStatus.find(s => s === pr.status)) {
                    valid = true;
                }
                else
                    valid = false;
            }
            if(valid) 
                resArray.push(pr);
        });
        if(resArray.length != 0) {
            return res.status(200).json(resArray);
        } 
        else
            return res.status(404).json({id: "-1", message: 'No product found'});
    }
    else {
        return res.status(200).json(prodDb);
    }
}

//used to add a new prod (if not already exists)
function addProd(req, res) {
    var p = req.swagger.params.product.value;
    if(p.name && p.catg && p.price && p.status && p.sellMode) { 
        var exists = prodDb.find(function(pr,i) {
            if(pr.name === p.name && pr.price === p.price && pr.catg === p.catg && pr.brand === p.brand) {
                return true;
            }
        });
        if(exists) {
            return res.status(400).json({ id: "-1", message: 'Product with this name and brand already exist!!'});
        }
        p.gstBracket = categories[p.catg].gst;
        p.sku = genSKU(p.name, categories[p.catg].id);
        console.log("Adding Product\n",p);
        prodDb.push(p);
        catgProds[p.catg].push({id: p.sku, name: p.name});
        return res.status(200).json({ id: p.sku, message: 'Added Successfully'});
    }
    return res.status(400).json({ id: "-1", message: 'Operation Failed!!'});
}

//utility function to find prod Index in array
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

//used to update an existing products attributes
function updateProd(req, res) {
    var id = req.swagger.params.prodID.value;
    var p = req.swagger.params.product.value;
    console.log(id,p);
    var prodIdx = findProd(id);
    if(prodIdx != -1) {
        Object.keys(prod).forEach(key => {
            if(p[key] == null || (Array.isArray(p[key]) && p[key].length == 0))  {
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
        return res.status(404).json({ id: "-1", message: 'No product found with id ' + id});
    }
}

//used to delete a products specific or all attributes
function delById(req,res) {
    var pid = req.swagger.params.prodID.value;
    var attrs = req.swagger.params.attributes.value;
    var prodIdx;
    if (pid == null) {
        return res.status(500).json({ id: "-1", message: 'Please enter ProdID'});
    }
    var prodIdx = findProd(pid);
    if(prodIdx != -1) {
        var x = prodDb[prodIdx];
        if(attrs && attrs.length != 0) {
            attrs.forEach(atr => {
                if(atr === "offers" && x.offers) {
                    delete x["offers"];
                }
                if(x[atr]) {
                    delete x[atr];
                }
                
            });
            return res.status(200).json({ id: pid, message: 'Attributes Deleted'});
        }
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
        return res.status(404).json({ id: "-1", message: 'No product found with id ' + pid});
    }
}

//used to get a product by its id and displays specific or all attributes
function getById(req,res) {
    var pid = req.swagger.params.prodID.value;
    var attrs = req.swagger.params.attributes.value;
    if (pid == null) {
        return res.status(500).json({ id: "-1", message: 'Please enter ProdID'});
    }
    var prodIdx = findProd(pid);
    if(prodIdx != -1) {
        var x = prodDb[prodIdx];
        var p = {sku: x.sku};
        if(attrs && attrs.length != 0) {
            attrs.forEach(atr => {
                if(atr === "brand" && x.brand) {
                    p["brand"] = x.brand;
                }
                if(atr === "category") {
                    p["catg"] = x.catg;
                }
                if(atr === "taxed-price") {
                    p["price"] = x.price;
                    p["taxedPrice"] = p.price + (p.price * x.gstBracket * 0.01);
                }
                if(atr === "status") {
                    p["status"] = x.status;
                }
                if(atr === "variations") {
                    if(x.sizes && x.sizes.length != 0) p["sizes"] = x.sizes;
                    if(x.colors && x.colors.length != 0) p["colors"] = x.colors;
                }
                if(atr === "offers" && x.offers && x.offers.length != 0) {
                    p["offers"] = x.offers;
                }
            });
            console.log(p);
            return res.status(200).json(p);
        }
        return res.status(200).json(x);
    }
    else {
        return res.status(404).json({ id: "-1", message: 'No product found with id ' + pid});
    }
}

//used to filter all the products by specific categories
function filterCatg(req,res) {
    var catgs = req.swagger.params.filters.value;
    if (catgs && catgs.length != 0) {
        var catgRes = {};
        catgs.forEach(c => {
            catgRes[c] = catgProds[c];
        });
        console.log(catgRes);
        return res.status(200).json(catgRes);
    }
    return res.status(200).json(catgProds);
}

//used to fetch all the products having some offers
function getOffers(req,res) {
    var OffRes = {};
    prodDb.forEach(p => {
        if(p.offers && p.offers.length != 0) {
            var id = p.sku;
            OffRes[id] = p.offers;
        }
    });
    if(Object.keys(OffRes).length != 0)
        return res.status(200).send(OffRes);
    else
        return res.status(404).json({ id: "-1", message: 'No offers available on any product'});
}