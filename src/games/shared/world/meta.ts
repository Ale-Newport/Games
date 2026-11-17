/**
 * Country facts shared by the geography games (#204, #205, #209, #211, #212, #225).
 *
 * One line per country: `ISO2|continent|capital (en)|capital (es)|population (thousands)|area (km²)`.
 * Continents: af Africa, as Asia, eu Europe, na North America (with Central America and the
 * Caribbean), sa South America, oc Oceania. Populations are rounded mid-2023 estimates (UN World
 * Population Prospects order of magnitude); areas are total areas, rounded. Figures are for play,
 * not reference. Country names come from `names.ts` (generated from i18n-iso-countries).
 */
export type Continent = 'af' | 'as' | 'eu' | 'na' | 'sa' | 'oc';

const RAW = `AD|eu|Andorra la Vella|Andorra la Vieja|80|468
AE|as|Abu Dhabi|Abu Dabi|9516|83600
AF|as|Kabul|Kabul|42240|652230
AG|na|Saint John's|Saint John's|94|442
AL|eu|Tirana|Tirana|2833|28748
AM|as|Yerevan|Ereván|2778|29743
AO|af|Luanda|Luanda|36685|1246700
AR|sa|Buenos Aires|Buenos Aires|45774|2780400
AT|eu|Vienna|Viena|8958|83871
AU|oc|Canberra|Canberra|26439|7692024
AZ|as|Baku|Bakú|10412|86600
BA|eu|Sarajevo|Sarajevo|3210|51197
BB|na|Bridgetown|Bridgetown|282|430
BD|as|Dhaka|Daca|172954|148460
BE|eu|Brussels|Bruselas|11686|30528
BF|af|Ouagadougou|Uagadugú|23251|274200
BG|eu|Sofia|Sofía|6688|110879
BH|as|Manama|Manama|1485|785
BI|af|Gitega|Gitega|13238|27834
BJ|af|Porto-Novo|Porto Novo|13712|114763
BN|as|Bandar Seri Begawan|Bandar Seri Begawan|452|5765
BO|sa|Sucre|Sucre|12388|1098581
BR|sa|Brasília|Brasilia|216422|8515767
BS|na|Nassau|Nasáu|412|13943
BT|as|Thimphu|Timbu|787|38394
BW|af|Gaborone|Gaborone|2675|581730
BY|eu|Minsk|Minsk|9498|207600
BZ|na|Belmopan|Belmopán|410|22966
CA|na|Ottawa|Ottawa|38781|9984670
CD|af|Kinshasa|Kinsasa|102262|2344858
CF|af|Bangui|Bangui|5742|622984
CG|af|Brazzaville|Brazzaville|6106|342000
CH|eu|Bern|Berna|8796|41285
CI|af|Yamoussoukro|Yamusukro|28873|322463
CL|sa|Santiago|Santiago|19629|756102
CM|af|Yaoundé|Yaundé|28647|475442
CN|as|Beijing|Pekín|1425671|9596961
CO|sa|Bogotá|Bogotá|52085|1141748
CR|na|San José|San José|5212|51100
CU|na|Havana|La Habana|11194|109884
CV|af|Praia|Praia|598|4033
CY|eu|Nicosia|Nicosia|1260|9251
CZ|eu|Prague|Praga|10495|78871
DE|eu|Berlin|Berlín|83294|357588
DJ|af|Djibouti|Yibuti|1136|23200
DK|eu|Copenhagen|Copenhague|5911|42933
DM|na|Roseau|Roseau|73|751
DO|na|Santo Domingo|Santo Domingo|11332|48671
DZ|af|Algiers|Argel|45606|2381741
EC|sa|Quito|Quito|18190|276841
EE|eu|Tallinn|Tallin|1322|45339
EG|af|Cairo|El Cairo|112717|1002450
EH|af|Laayoune|El Aaiún|588|266000
ER|af|Asmara|Asmara|3748|117600
ES|eu|Madrid|Madrid|47519|505990
ET|af|Addis Ababa|Adís Abeba|126527|1104300
FI|eu|Helsinki|Helsinki|5546|338455
FJ|oc|Suva|Suva|936|18274
FM|oc|Palikir|Palikir|115|702
FR|eu|Paris|París|64757|643801
GA|af|Libreville|Libreville|2437|267668
GB|eu|London|Londres|67736|243610
GD|na|Saint George's|Saint George's|126|344
GE|as|Tbilisi|Tiflis|3728|69700
GH|af|Accra|Acra|34122|238533
GL|na|Nuuk|Nuuk|56|2166086
GM|af|Banjul|Banjul|2773|11295
GN|af|Conakry|Conakri|14191|245857
GQ|af|Malabo|Malabo|1714|28051
GR|eu|Athens|Atenas|10341|131957
GT|na|Guatemala City|Ciudad de Guatemala|18092|108889
GW|af|Bissau|Bisáu|2150|36125
GY|sa|Georgetown|Georgetown|813|214969
HN|na|Tegucigalpa|Tegucigalpa|10594|112492
HR|eu|Zagreb|Zagreb|4008|56594
HT|na|Port-au-Prince|Puerto Príncipe|11724|27750
HU|eu|Budapest|Budapest|10156|93028
ID|as|Jakarta|Yakarta|277534|1904569
IE|eu|Dublin|Dublín|5056|70273
IL|as|Jerusalem|Jerusalén|9174|20770
IN|as|New Delhi|Nueva Delhi|1428628|3287263
IQ|as|Baghdad|Bagdad|45504|438317
IR|as|Tehran|Teherán|89172|1648195
IS|eu|Reykjavík|Reikiavik|376|103000
IT|eu|Rome|Roma|58870|301340
JM|na|Kingston|Kingston|2825|10991
JO|as|Amman|Amán|11337|89342
JP|as|Tokyo|Tokio|123295|377975
KE|af|Nairobi|Nairobi|55101|580367
KG|as|Bishkek|Biskek|6735|199951
KH|as|Phnom Penh|Nom Pen|16944|181035
KI|oc|Tarawa|Tarawa|133|811
KM|af|Moroni|Moroni|852|1862
KN|na|Basseterre|Basseterre|47|261
KP|as|Pyongyang|Pionyang|26161|120538
KR|as|Seoul|Seúl|51785|100210
KW|as|Kuwait City|Ciudad de Kuwait|4311|17818
KZ|as|Astana|Astaná|19606|2724900
LA|as|Vientiane|Vientián|7633|236800
LB|as|Beirut|Beirut|5353|10452
LC|na|Castries|Castries|180|616
LI|eu|Vaduz|Vaduz|40|160
LK|as|Sri Jayawardenepura Kotte|Sri Jayawardenapura Kotte|21894|65610
LR|af|Monrovia|Monrovia|5418|111369
LS|af|Maseru|Maseru|2330|30355
LT|eu|Vilnius|Vilna|2718|65300
LU|eu|Luxembourg|Luxemburgo|654|2586
LV|eu|Riga|Riga|1830|64559
LY|af|Tripoli|Trípoli|6888|1759540
MA|af|Rabat|Rabat|37840|446550
MC|eu|Monaco|Mónaco|36|2
MD|eu|Chișinău|Chisináu|3435|33846
ME|eu|Podgorica|Podgorica|626|13812
MG|af|Antananarivo|Antananarivo|30326|587041
MH|oc|Majuro|Majuro|42|181
MK|eu|Skopje|Skopie|2085|25713
ML|af|Bamako|Bamako|23294|1240192
MM|as|Naypyidaw|Naipyidó|54578|676578
MN|as|Ulaanbaatar|Ulán Bator|3447|1564116
MR|af|Nouakchott|Nuakchot|4863|1030700
MT|eu|Valletta|La Valeta|535|316
MU|af|Port Louis|Port Louis|1262|2040
MV|as|Malé|Malé|521|300
MW|af|Lilongwe|Lilongüe|20932|118484
MX|na|Mexico City|Ciudad de México|128456|1964375
MY|as|Kuala Lumpur|Kuala Lumpur|34308|330803
MZ|af|Maputo|Maputo|33897|801590
NA|af|Windhoek|Windhoek|2604|825615
NE|af|Niamey|Niamey|27202|1267000
NG|af|Abuja|Abuya|223804|923768
NI|na|Managua|Managua|7046|130373
NL|eu|Amsterdam|Ámsterdam|17618|41850
NO|eu|Oslo|Oslo|5474|385207
NP|as|Kathmandu|Katmandú|30897|147181
NR|oc|Yaren|Yaren|13|21
NZ|oc|Wellington|Wellington|5228|268021
OM|as|Muscat|Mascate|4644|309500
PA|na|Panama City|Ciudad de Panamá|4468|75417
PE|sa|Lima|Lima|34352|1285216
PG|oc|Port Moresby|Port Moresby|10330|462840
PH|as|Manila|Manila|117337|300000
PK|as|Islamabad|Islamabad|240486|881913
PL|eu|Warsaw|Varsovia|41026|312696
PR|na|San Juan|San Juan|3260|9104
PS|as|Ramallah|Ramala|5371|6020
PT|eu|Lisbon|Lisboa|10247|92212
PW|oc|Ngerulmud|Ngerulmud|18|459
PY|sa|Asunción|Asunción|6862|406752
QA|as|Doha|Doha|2716|11586
RO|eu|Bucharest|Bucarest|19892|238397
RS|eu|Belgrade|Belgrado|7149|77474
RU|eu|Moscow|Moscú|144444|17098246
RW|af|Kigali|Kigali|14095|26338
SA|as|Riyadh|Riad|36947|2149690
SB|oc|Honiara|Honiara|740|28896
SC|af|Victoria|Victoria|108|459
SD|af|Khartoum|Jartum|48109|1886068
SE|eu|Stockholm|Estocolmo|10612|450295
SG|as|Singapore|Singapur|6014|734
SI|eu|Ljubljana|Liubliana|2120|20273
SK|eu|Bratislava|Bratislava|5795|49035
SL|af|Freetown|Freetown|8791|71740
SM|eu|San Marino|San Marino|34|61
SN|af|Dakar|Dakar|17763|196722
SO|af|Mogadishu|Mogadiscio|18143|637657
SR|sa|Paramaribo|Paramaribo|623|163820
SS|af|Juba|Yuba|11089|619745
ST|af|São Tomé|Santo Tomé|232|964
SV|na|San Salvador|San Salvador|6365|21041
SY|as|Damascus|Damasco|23227|185180
SZ|af|Mbabane|Mbabane|1210|17364
TD|af|N'Djamena|Yamena|18279|1284000
TG|af|Lomé|Lomé|9054|56785
TH|as|Bangkok|Bangkok|71801|513120
TJ|as|Dushanbe|Dusambé|10143|143100
TL|as|Dili|Dili|1361|14874
TM|as|Ashgabat|Asjabad|6516|488100
TN|af|Tunis|Túnez|12458|163610
TO|oc|Nukuʻalofa|Nukualofa|108|747
TR|as|Ankara|Ankara|85816|783562
TT|na|Port of Spain|Puerto España|1534|5130
TW|as|Taipei|Taipéi|23923|36197
TZ|af|Dodoma|Dodoma|67438|945087
UA|eu|Kyiv|Kiev|36744|603550
UG|af|Kampala|Kampala|48582|241550
US|na|Washington, D.C.|Washington D. C.|339997|9833520
UY|sa|Montevideo|Montevideo|3423|176215
UZ|as|Tashkent|Taskent|35164|448978
VA|eu|Vatican City|Ciudad del Vaticano|1|0.49
VC|na|Kingstown|Kingstown|104|389
VE|sa|Caracas|Caracas|28838|916445
VN|as|Hanoi|Hanói|98859|331212
VU|oc|Port Vila|Port Vila|335|12189
WS|oc|Apia|Apia|225|2842
XK|eu|Pristina|Pristina|1756|10887
YE|as|Sanaa|Saná|34450|527968
ZA|af|Pretoria|Pretoria|60414|1221037
ZM|af|Lusaka|Lusaka|20570|752612
ZW|af|Harare|Harare|16665|390757`;

export interface CountryMeta {
  iso2: string;
  continent: Continent;
  capital: { en: string; es: string };
  /** Thousands of people (rounded 2023 estimate). */
  population: number;
  /** Square kilometres. */
  area: number;
}

export const COUNTRY_META: readonly CountryMeta[] = RAW.split('\n').map((line) => {
  const [iso2, continent, en, es, pop, area] = line.split('|');
  return {
    iso2: iso2!,
    continent: continent as Continent,
    capital: { en: en!, es: es! },
    population: Number(pop),
    area: Number(area),
  };
});

export const META_BY_ISO2 = new Map(COUNTRY_META.map((m) => [m.iso2, m]));
