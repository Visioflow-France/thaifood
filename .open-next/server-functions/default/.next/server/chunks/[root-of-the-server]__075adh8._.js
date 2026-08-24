module.exports=[54799,(e,t,r)=>{t.exports=e.x("crypto",()=>require("crypto"))},18622,(e,t,r)=>{t.exports=e.x("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js",()=>require("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js"))},20635,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/action-async-storage.external.js",()=>require("next/dist/server/app-render/action-async-storage.external.js"))},24725,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/after-task-async-storage.external.js",()=>require("next/dist/server/app-render/after-task-async-storage.external.js"))},56704,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-async-storage.external.js",()=>require("next/dist/server/app-render/work-async-storage.external.js"))},32319,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-unit-async-storage.external.js",()=>require("next/dist/server/app-render/work-unit-async-storage.external.js"))},59043,(e,t,r)=>{t.exports=e.x("next/dist/server/runtime-reacts.external.js",()=>require("next/dist/server/runtime-reacts.external.js"))},93695,(e,t,r)=>{t.exports=e.x("next/dist/shared/lib/no-fallback-error.external.js",()=>require("next/dist/shared/lib/no-fallback-error.external.js"))},81111,(e,t,r)=>{t.exports=e.x("node:stream",()=>require("node:stream"))},14747,(e,t,r)=>{t.exports=e.x("path",()=>require("path"))},24361,(e,t,r)=>{t.exports=e.x("util",()=>require("util"))},11916,e=>{"use strict";var t=e.i(54799);new Intl.NumberFormat("fr-FR",{minimumFractionDigits:2,maximumFractionDigits:2});let r=new Set(["77340"]),n=["pontault"];function a(e){return String(e||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9]/g,"")}let i=e=>Math.round(100*(Number(e)||0))/100;var s=e.i(51373),o=e.i(34888),l=e.i(90599);let c="orders",d="ABCDEFGHJKMNPQRSTUVWXYZ23456789";async function u(){let e=(0,o.getDb)().collection("config").doc("orderSeq"),t=function(e="Europe/Paris"){try{return new Date().toLocaleDateString("sv-SE",{timeZone:e})}catch{let e=new Date,t=e=>String(e).padStart(2,"0");return`${e.getFullYear()}-${t(e.getMonth()+1)}-${t(e.getDate())}`}}(),r=1;return await (0,o.getDb)().runTransaction(async n=>{let a=await n.get(e),i=a.exists?a.data():null;r=i&&i.date===t?(Number(i.count)||0)+1:1,n.set(e,{date:t,count:r},{merge:!0})}),{day:t,seq:r}}class p extends Error{}let m={pickup:["firstName","lastName","phone"],delivery:["firstName","lastName","phone","address","postalCode","city"]},x={firstName:"prénom",lastName:"nom",phone:"téléphone",email:"e-mail",address:"adresse",postalCode:"code postal",city:"ville"};async function g(e={}){let s=Array.isArray(e.items)?e.items:[];if(0===s.length)throw new p("Votre panier est vide.");let o="delivery"===e.type?"delivery":"pickup",c=e.customer||{};for(let e of m[o])if(!String(c[e]||"").trim())throw new p(`Champ requis : ${x[e]||e}.`);if(c.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email))throw new p("Adresse e-mail invalide.");if(!/^[+0-9().\s-]{8,}$/.test(c.phone))throw new p("Numéro de téléphone invalide.");let u=await (0,l.getDishes)(),f=await (0,l.getPromos)(),y=new Map;for(let e of u)e&&e.name&&y.set(String(e.name).trim().toLowerCase(),e);let h=s.map(e=>{let t,r=String(e.name||"").trim().toLowerCase(),n=y.get(r);if(!n)throw new p(`Plat introuvable : ${e.name||"inconnu"}.`);if(!1===n.available)throw new p(`Ce plat n'est plus disponible : ${n.name}.`);return{name:String(n.name).slice(0,120),price:Math.max(0,Number(function(e,t){let r=Number(e)||0;if(!t)return{finalPrice:r,hasPromo:!1,originalPrice:r};let n=r;return"percent"===t.type?n=Math.round(r*(1-Math.max(0,Math.min(100,Number(t.value)||0))/100)*100)/100:"fixed"===t.type&&(n=Math.max(0,Number(t.value)||0)),{finalPrice:n,hasPromo:n<r,originalPrice:r}}(n.price,(t=(f||[]).filter(e=>!1!==e.active)).find(e=>"dish"===e.scope&&e.targetId===n.id)||t.find(e=>"category"===e.scope&&e.targetId===n.categoryId)||t.find(e=>"global"===e.scope)||null).finalPrice)||0),qty:Math.max(1,Math.min(99,parseInt(e.qty,10)||1)),image:n.img||e.image||null}}),{subtotal:v,deliveryFee:S,total:w}=function(e,t="pickup",s=null){let o=i((e||[]).reduce((e,t)=>e+t.qty*t.price,0)),l=0;return"delivery"===t&&o>0&&(l=function(e={}){let t=a(e.postalCode);if(t&&r.has(t))return!0;let i=a(e.city);return n.some(e=>i.includes(e))}(s||{})&&o>=20?0:3),{subtotal:o,deliveryFee:i(l),total:i(o+l)}}(h,o,{postalCode:c.postalCode,city:c.city});return{id:function(e="ord"){return`${e}_${Date.now().toString(36)}${Math.random().toString(36).slice(2,7)}`}("ord"),ref:function(){let e=t.default.randomBytes(6),r="";for(let t=0;t<6;t++)r+=d[e[t]%d.length];return`TF-${r}`}(),createdAt:new Date().toISOString(),status:"received",type:o,customer:{firstName:String(c.firstName||"").trim(),lastName:String(c.lastName||"").trim(),phone:String(c.phone||"").trim(),email:String(c.email||"").trim(),address:String(c.address||"").trim(),postalCode:String(c.postalCode||"").trim(),city:String(c.city||"").trim(),notes:String(c.notes||"").trim().slice(0,500)},scheduledFor:e.scheduledFor||null,items:h,subtotal:v,deliveryFee:S,total:w,channel:"web",freeDeliveryThreshold:20}}async function f(e){let t=(0,o.getDb)().collection(c),r=await t.where("ref","==",e).limit(1).get();if(!r.empty){let e=r.docs[0];return{doc:e.ref,order:{id:e.id,...e.data()}}}let n=await t.doc(e).get();return n.exists?{doc:n.ref,order:{id:n.id,...n.data()}}:null}async function y(e){return await (0,o.getDb)().collection(c).doc(e.id).set(e),e}async function h(){try{let e=await (0,o.getDb)().collection(c).orderBy("createdAt","desc").get();return e.empty?[]:e.docs.map(e=>({id:e.id,...e.data()}))}catch(e){return console.error("[orders] lecture impossible :",e?.details||e?.message),[]}}async function v(e){let t=await f(e);return t?t.order:null}async function S(e,t){let r=await f(e);if(!r)return null;let n={status:t,updatedAt:new Date().toISOString()};return await r.doc.update(n),{...r.order,...n}}async function w(e){let t=await f(e);if(!t)return null;if(t.order.printedAt)return{...t.order};let r={printedAt:new Date().toISOString()};return await t.doc.update(r),{...t.order,...r}}async function b(){if(!process.env.STRIPE_SECRET_KEY)return!1;let{connectedAccountId:e}=await (0,s.getSettings)();return!!e}async function D(e,t={}){let r=await f(e);if(!r)return null;if("paid"===r.order.status||"cancelled"===r.order.status)return{...r.order};let n={status:"paid",paidAt:new Date().toISOString(),payment:{paymentIntentId:t.paymentIntentId||r.order.payment?.paymentIntentId||null,checkoutSessionId:t.checkoutSessionId||null,feeAmount:"number"==typeof t.feeAmount?t.feeAmount:null,paidAmount:"number"==typeof t.paidAmount?t.paidAmount:null},updatedAt:new Date().toISOString()};if(!Number.isFinite(r.order.dailySeq)){let{day:e,seq:t}=await u();n.day=e,n.dailySeq=t}return await r.doc.update(n),{...r.order,...n}}async function N(e,t=""){let r=await f(e);if(!r)return null;let n={status:"failed",failureReason:String(t||"").slice(0,300),updatedAt:new Date().toISOString()};return await r.doc.update(n),{...r.order,...n}}e.s(["ORDER_STATUSES",0,["received","awaiting_payment","paid","failed","confirmed","preparing","ready","fulfilled","cancelled"],"OrderError",0,p,"buildOrder",0,g,"getOrderByRef",0,v,"getOrders",0,h,"isStripeActive",0,b,"markOrderFailed",0,N,"markOrderPaid",0,D,"markOrderPrinted",0,w,"nextDailySequence",0,u,"saveOrder",0,y,"updateOrderStatus",0,S],11916)},51373,e=>{"use strict";var t=e.i(34888);let r="config",n="stripe",a={connectedAccountId:null,account:null};async function i(){let e=await (0,t.getDb)().collection(r).doc(n).get();return e.exists?{...a,...e.data()}:{...a}}async function s(e={}){let i=(0,t.getDb)().collection(r).doc(n);await i.set(e,{merge:!0});let o=await i.get();return{...a,...o.data()}}e.s(["getCommissionPercent",0,function(){let e;return Number.isFinite(e=Number(process.env.PLATFORM_COMMISSION_PERCENT))?Math.max(0,Math.min(50,Math.round(100*e)/100)):0},"getSettings",0,i,"saveSettings",0,s])},80029,e=>{"use strict";var t=e.i(34888);let r="config",n="site",a={companyName:"Thaï Food 77",legalForm:"",siret:"",rcs:"",capitalSocial:"",tvaIntracom:"",streetAddress:"142 Avenue Charles Rouxel",postalCode:"77340",city:"Pontault-Combault",email:"pad.77thai@gmail.com",publicationDirector:"",hostName:"Vercel Inc.",hostAddress:"340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis",hostUrl:"https://vercel.com"},i=e=>String(e||"").trim()?String(e).trim():"[à renseigner]",s=(e,t)=>{let r=String(t||"").trim();return r?`${e} : ${r}`:""};function o(e={}){let t={...a,...e||{}},r=[t.streetAddress,[t.postalCode,t.city].filter(Boolean).join(" ")].filter(Boolean),n=["[à renseigner]"!==i(t.companyName)&&t.legalForm?`${t.companyName} (${t.legalForm})`:i(t.companyName),r.length?r.join(", "):"[adresse à renseigner]",t.phone||t.email?s("Contact",[t.phone,t.email].filter(Boolean).join(" · ")||null):"",[s("SIRET",t.siret),s("RCS",t.rcs),s("Capital social",t.capitalSocial),s("TVA intracommunautaire",t.tvaIntracom)].filter(Boolean).join(" · ")].filter(Boolean);return`# Mentions l\xe9gales

Ann\xe9e d'\xe9dition : 2026

## 1. \xc9diteur du site
Le pr\xe9sent site internet est \xe9dit\xe9 par :
${n.map(e=>`- ${e}`).join("\n")}

## 2. Directeur / Directrice de la publication
${i(t.publicationDirector)}

## 3. H\xe9bergement
Le site est h\xe9berg\xe9 par : ${i(t.hostName)}
${t.hostAddress?`Adresse : ${t.hostAddress}`:""}
${t.hostUrl?`Site web : ${t.hostUrl}`:""}

## 4. Propri\xe9t\xe9 intellectuelle
L'ensemble des \xe9l\xe9ments pr\xe9sents sur ce site (textes, visuels, photographies,
logo, charte graphique, mise en page) est, sauf mention contraire, la propri\xe9t\xe9
exclusive de ${i(t.companyName)}. Toute reproduction, repr\xe9sentation,
modification, publication ou adaptation, totale ou partielle, quel que soit le
proc\xe9d\xe9 ou le support, est interdite sans autorisation \xe9crite pr\xe9alable.

## 5. Donn\xe9es personnelles & RGPD
${i(t.companyName)}, en tant que responsable de traitement, est susceptible de
collecter des donn\xe9es \xe0 caract\xe8re personnel via les formulaires du site
(commande en ligne, prise de contact) : nom, pr\xe9nom, coordonn\xe9es
t\xe9l\xe9phoniques et postales, adresse e-mail.

Finalit\xe9s : traitement et suivi des commandes, gestion de la relation client et
pr\xe9paration des repas command\xe9s (livraison ou retrait sur place). La base
l\xe9gale est l'ex\xe9cution du contrat et, le cas \xe9ch\xe9ant, le consentement.
Destinataires : les donn\xe9es sont destin\xe9es aux services internes de
${i(t.companyName)} et, pour la seule ex\xe9cution de la commande (ex. paiement,
livraison), \xe0 ses prestataires techniques (Stripe pour les paiements, service
de livraison). Elles ne font l'objet d'aucune cession commerciale \xe0 des tiers.

Dur\xe9e de conservation : les donn\xe9es sont conserv\xe9es le temps strictement
n\xe9cessaire au traitement de la commande, puis archiv\xe9es pour la dur\xe9e des
obligations l\xe9gales comptables (10 ans), avant suppression d\xe9finitive.

Conform\xe9ment au R\xe8glement G\xe9n\xe9ral sur la Protection des Donn\xe9es (RGPD) et \xe0 la
loi Informatique et Libert\xe9s, vous disposez d'un droit d'acc\xe8s, de
rectification, d'effacement, de limitation, d'opposition et de portabilit\xe9 de
vos donn\xe9es. Pour les exercer, \xe9crivez \xe0 ${i(t.email)} en justifiant de votre
identit\xe9. Vous pouvez \xe9galement introduire une r\xe9clamation aupr\xe8s de la CNIL
(www.cnil.fr).

## 6. Cookies & traceurs
Ce site utilise des cookies strictement n\xe9cessaires \xe0 son fonctionnement
(m\xe9morisation du panier de commande) ainsi que, le cas \xe9ch\xe9ant, des traceurs
d\xe9pos\xe9s par des tiers (paiement Stripe). Aucun cookie publicitaire ou de
profiling commercial n'est utilis\xe9. Vous pouvez \xe0 tout moment configurer ou
d\xe9sactiver ces traceurs depuis les r\xe9glages de votre navigateur.

## 7. Conditions de commande
Les prix sont indiqu\xe9s en euros, toutes taxes comprises (TTC). Le paiement peut
\xeatre effectu\xe9 en ligne, de mani\xe8re s\xe9curis\xe9e via Stripe, ou sur place / \xe0 la
livraison selon les options propos\xe9es. Les commandes sont pr\xe9par\xe9es \xe0 la
demande ; le retrait s'effectue \xe0 l'adresse du restaurant et la livraison dans
la zone desservie. En validant une commande, vous reconnaissez avoir pris
connaissance des pr\xe9sentes conditions.

## 8. Droit applicable
Le pr\xe9sent site et ses mentions l\xe9gales sont soumis au droit fran\xe7ais. Tout
litige rel\xe8vera, \xe0 d\xe9faut de r\xe9solution amiable, de la comp\xe9tence des
tribunaux fran\xe7ais.

\xa9 2026 ${i(t.companyName)}. Tous droits r\xe9serv\xe9s.`}let l={phone:"",legal:o(a),legalFields:{...a},hours:{1:[{open:"11:30",close:"14:00"},{open:"18:30",close:"22:00"}],2:[{open:"11:30",close:"14:00"},{open:"18:30",close:"22:00"}],3:[{open:"11:30",close:"14:00"},{open:"18:30",close:"22:00"}],4:[{open:"11:30",close:"14:00"},{open:"18:30",close:"22:00"}],5:[{open:"11:30",close:"14:00"},{open:"18:30",close:"22:30"}],6:[{open:"18:30",close:"22:30"}],0:[{open:"12:00",close:"22:00"}]},socials:{instagram:"",facebook:"",tiktok:"",tripadvisor:""},content:{heroImage:"",chefName:"",chefRole:"",chefPhoto:"",storyTitle:"",storyText1:"",storyText2:"",sinceYear:"",histoireImages:["","","",""]}};async function c(){let e=await (0,t.getDb)().collection(r).doc(n).get();return e.exists?{...l,...e.data()}:{...l}}async function d(e={}){let a=(0,t.getDb)().collection(r).doc(n);await a.set(e,{merge:!0});let i=await a.get();return{...l,...i.data()}}e.s(["buildLegalMarkdown",0,o,"getSiteInfo",0,c,"saveSiteInfo",0,d])}];

//# sourceMappingURL=%5Broot-of-the-server%5D__075adh8._.js.map