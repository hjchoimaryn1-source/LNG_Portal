# MRO/IMPA Catalog Ingest Report (Track 1)

Generated: 2026-09-16T03:15:53.220Z
Source: IMPA_Store_Code.xlsx

## Summary

- Total rows scanned (all sheets): **2248**
- IN-SCOPE sheets (per impa-scope-whitelist.md): **15**
- Rows skipped (out-of-scope or REVIEW-ONLY sheets): **1245**
- Unique impa_code rows after dedup: **804**
- Duplicate impa_code groups collapsed: **135**
- Rows already present in impa_catalog before this run (skipped): **804**
- Rows inserted this run: **0**

**No stock quantities were migrated.** The source file's "ON HAND QTY (ROB)" column was not read — inventory_items/inventory_ledgers remain the sole stock SSOT. **No asset_parts_impa rows were created** — the source is a store/supplies ROB list with no equipment_tag data, so there is nothing genuinely equipment-specific to map.

## Dedup Log (discarded description variants)

| impa_code | kept | discarded |
| --- | --- | --- |
| 351054 | CAST BRONZE AIR HOSE COUPLINGS M42X2,12 MM | CAST BRONZE AIR HOSE COUPLING, M42 x 2 |
| 351221 | Coupler, quick-connect single off, Hose end Type (stainless Steel) SH Series Socket | COUPLER, QUICK-CONNECT, SINGLE END SHUT OFF, S.STEEL, SH SERIES SOCKET 1/4 |
| 351222 | Coupler, quick-connect, single end shut off, stainless steel, SH series Socket, hose end size 3/8 | COUPLER, QUICK-CONNECT, SINGLE END SHUT OFF, S.STEEL, SH SERIES SOCKET 3/8 |
| 351251 | Coupler, quick-connect single off, Hose end Type (stainless Steel) PH Series Plug | COUPLER, QUICK-CONNECT, SINGLE END SHUT OFF, S.STEEL, PH SERIES PLUG 1/4 |
| 351252 | Coupler, quick-connect, single end shut off, stainless steel, PH series Plug, hose end size 3/8 | COUPLER, QUICK-CONNECT, SINGLE END SHUT OFF, S.STEEL, PH SERIES PLUG 3/8 |
| 351322 | COUPLER, QUICK-CONNECT, SINGLE END SHUT OFF, S.STEEL, SM SERIES SOCKET, MALE THREAD END 1/4 | Coupler, quick-connect, Male Thread type (Stainless Steel) SM Series Socket |
| 351352 | COUPLER, QUICK-CONNECT, SINGLE END SHUT OFF, S.STEEL, PM SERIES PLUG, MALE THREAD END 1/4 | Coupler, quick-connect, Male Thread type (Stainless Steel) PM Series Plug |
| 590301 | Angle grinder, pneumatic, wheel size (O.D 100 x Thickness 6 x I.D 15 mm) - Japan Made | ANGLE GRINDER, PNEUMATIC, O.D=100MM X T=6MM X I.D=15MM, YUTANI (JAPAN) /// Grinder Angle Pneumatic Completed Set (Gurinda angin) Tools |
| 590463 | Pneumatic Jet Chisels JEX-24, Needles 3Ø x 23s (Japan) | PNEUMATIC JET CHISELS JEX-24 /// Pneumatic Jet Chisels, JEX-66(JEX28) |
| 590468 | Spare Needles for Jet Chisel, Needle diam X Length 3Ø X 180 mm, 100/box - Japan Made | SPARE NEEDLES FOR JET CHISEL (3x180mm) |
| 591417 | Ventilation fan, explosion-proof, portable, electric, Ø200, AC-220 V | Electric Fan Ventilation Portable Explosion Proof Size 300mm (12"). |
| 591601 | PUMP, PNEUMATIC DIAPHRAGM PUMP, WILDEN, MODEL P2, INLET 1", OUTLET 3/4" | Pneumatic diaphragm pumps (Portable wilden pump), type T2 |
| 592073 | Wire cup brush, Plaited, 80 mm dia for heavy rust, (2,5 Inch) | Wire cup brush, Plaited, 80 mm dia for heavy rust |
| 610405 | Ratchet handles for socket wrenches, Square drive 12.7 mm, Male, Length 270 mm | Rachet handles only, square drive 12.7mm Male /// RACHET HANDLES, SQUARE DRIVE=12.7MM, MALE, L=270MM, W=490MM |
| 610763 | OPEN & 12 POINT BOX WRENCHES 15⁰ ANGLE OPEN END - 12 POINT BOX END, METRIC, SIZE = 8 MM | Open & 12 Poin Box Wrenches ( opening 8 mm ) |
| 610765 | OPEN & 12 POINT BOX WRENCHES 15⁰ ANGLE OPEN END - 12 POINT BOX END, METRIC, SIZE = 10 MM | Open & 12 Box Point Box Wrenches, Opening 10 mm X Overall Length 118 mm /// Open & 12 Poin Box Wrenches ( opening 10 mm ) |
| 610766 | Open & 12 Box Point Box Wrenches, Opening 11 mm X Overall Length 134 mm | Open & 12 Poin Box Wrenches ( opening 11 mm ) |
| 610767 | OPEN & 12 POINT BOX WRENCHES 15⁰ ANGLE OPEN END - 12 POINT BOX END, METRIC, SIZE = 12 MM | Open & 12 Box Point Box Wrenches, Opening 12 mm X Overall Length 140 mm /// Open & 12 Poin Box Wrenches ( opening 12 mm ) |
| 610768 | OPEN & 12 POINT BOX WRENCHES 15⁰ ANGLE OPEN END - 12 POINT BOX END, METRIC, SIZE = 13 MM | Open & 12 Box Point Box Wrenches, Opening 13 mm X Overall Length 150 mm /// Open & 12 Poin Box Wrenches ( opening 13 mm ) |
| 610769 | OPEN & 12 POINT BOX WRENCHES 15⁰ ANGLE OPEN END - 12 POINT BOX END, METRIC, SIZE = 14 MM | Open & 12 Box Point Box Wrenches, Opening 14 mm X Overall Length 170 mm /// Open & 12 Poin Box Wrenches ( opening 14 mm ) /// OPEN & 12 POINT BOX WRENCHES 15⁰ ANGLE OPEN END - 12 POINT BOX END, METRIC, SIZE = 14MM |
| 610771 | OPEN & 12 POINT BOX WRENCHES 15⁰ ANGLE OPEN END - 12 POINT BOX END, METRIC, SIZE = 17 MM | Open & 12 Box Point Box Wrenches, Opening 17 mm X Overall Length 215 mm /// Open & 12 Poin Box Wrenches ( opening 17 mm ) |
| 610772 | OPEN & 12 POINT BOX WRENCHES 15⁰ ANGLE OPEN END - 12 POINT BOX END, METRIC, SIZE = 19 MM | Open & 12 Box Point Box Wrenches, Opening 19 mm X Overall Length 235 mm /// Open & 12 Poin Box Wrenches ( opening 19 mm ) |
| 610776 | OPEN & 12 POINT BOX WRENCHES 15⁰ ANGLE OPEN END - 12 POINT BOX END, METRIC, SIZE = 24 MM | Open & 12 Poin Box Wrenches ( opening 24 mm ) |
| 611281 | Allen Hexagon Wrench Sets, mm Across Flats 2.5, 3, 4, 5, 6, 8, 10, 12 | Allen Hexagon Wrench Set /// Allen key set /// WRENCH SET,ALLEN HEXAGON, SIZE=2.5,3,4,5,6,8,10,12 MM /// WRENCH SETS, ALLEN HEXAGON, SIZE (2,3,4,5,6,8,9,10,12), 8'S |
| 611282 | Allen Hexagon Wrench Sets, in Across Flats 1/8, 3/26, 7/32, 1/4, 5/16, 3/8, 7/16, 1/2 | WRENCH SET,ALLEN HEXAGON, SIZE=1/8,3/16,7/32,1/4,5/16,3/8,7/16,1/2 inch |
| 611303 | PIPE WRENCHES, STRAIGHT HEAVY DUTY, LENGTH=250MM | Pipe Wrenches, Straight, heavy duty |
| 611333 | Adjustable wrenches, heavy duty ( shifting spanners ), 200 mm | Adjustable wrenches, size: L 200mm x max jaw opening 24mm |
| 611642 | Vise Gripe Combination Pliers ( Mole Grip Wrenches) | VISE GRIP COMBINATION PLIERS (MOLE GRIP WRENCHES) |
| 611658 | SIDE CUTTING PLIERS, INSULATED HANDLE, LENGTH=175MM | Side cutting pliers, insulated handle |
| 612290 | Screwdriver, plastic handle, square blade, blade length 75 mm, width 5.5 mm, Slotted screwdriver | Screwdriver, Plastic handle, square, Slotted Blade Length 75mm, Blade Width 5.5mm |
| 612295 | Screwdriver, plastic handle, square blade, blade length 75 mm, No.1, Phillips screwdriver | Screwdriver, Plastic handle, square, Phillips Blade Length 75mm, Blade Width 5.5mm |
| 612611 | Hammer Chipping With Handdle | CHIPPING HAMMER |
| 613802 | Handy Tool Sets for minor adjustments engine & accessories lifeboat | HANDY TOOL SETS |
| 614010 | PUMP, HAND, PLASTIC, 540MM | Hand Pump Pail /// PLASTIC HAND PUMPS |
| 614054 | HOSE BAND GALV. STEEL 15-24MM / 3/4'' inc | HOSE BAND/ PIPE CLAMPS, SIZE=15-24MM |
| 614066 | Hose Band Stainless Steel 11 mm - 17 mm | Hose band, stainless steel, 11-17 mm /// HOSE BAND/ PIPE CLAMPS, SIZE=11-17MM |
| 614067 | Hose Bands, Stainless Steel, size 13-20 mm | Hose Band Stainless Steel 13 mm - 20 mm /// Hose band, stainless steel, 13-20 mm |
| 614069 | HOSE BAND SIZE 3/4 | Hose clamp 1" |
| 614072 | HOSE BAND STAINLESS STEEL 58 - 75 MM | HOSE BAND/ PIPE CLAMPS, SIZE=58-75MM /// Hose clamp 2 1/2" |
| 614803 | WHEEL, GRINDING, OFFSET, RESENOID, GRAIN NO. 36,OUT DIAMETER=100MM,THICKNESS=6MM,HOLE DIAMETER16MM | Resinoid offset grinding wheels 100 mm x 6 mm x 16 mm /// Wheel grinding offset OD:100mm X THICKNESS:1.5mm X HOLE DIAM:16mm /// Wheel Grinding Offset Resinoid ( 100 x 6 x 16 ) |
| 614857 | Wheel cutting offset OD:100mm X THICKNESS:1.5mm X HOLE DIAM:16mm | Ressinoid Cut-off Wheels 105 X 1.2 X 16mm |
| 614859 | Wheel cut-off, Resinoid, grain no. 36, O.D X Thickness X Hole diam 100 x 2.0 x 15.88 mm, 4300 mtr/min | Resinold cutt-off wheels 100 mm x 2 mm x 16 mm /// Wheel Cut off Resinoid ( 100 x 2 x 16 ) /// Wheel cut off, resinoid grain No.36, out dia: 100 X 2.0t X Hole dia 15.88 mm /// WHEEL CUT-OFF, RESENOID, GRAIN NO. 36, OUT DIAMETER=105MM, THICKNESS=1,2MM, HOLE DIAMETER=16MM |
| 614876 | WHEEL CUT-OFF, RESENOID, GRAIN NO. 36, OUT DIAMETER=305 MM, THICKNESS=2.5 MM, HOLE DIAMETER=25.4 MM | WHEEL CUT-OFF, RESENOID, GRAIN NO. 36, OUT DIAMETER=300MM, THICKNESS=2.5MM, HOLE DIAMETER=25.4MM |
| 614878 | Resinold cutt-off wheels 355 mm x 3,0 mm x 25,4 mm | Resinoid cut-off wheel D355mm x d25.4mm x T3.0mm |
| 615940 | Non-Spark Valve Wheel Wrenches F type (F-Key), Size 30 x 300mm (RE-SEND DST-24023) | Non-Spark Valve Wheel Wrenches F type (F-Key), Size 30 x 300mm |
| 632729 | TOOL, SINGLE POINT WITH CEMENTED CARBIDE TIP, MODEL 35 STRAIGHT, NO=2, SIZE=16X16X120MM | TOOL, SINGLE POINT WITH CEMENTED CARBIDE TIP, MODEL NO. 35 - 2 STRAIGHT, 16X16X120 MM |
| 632755 | TOOL, SINGLE POINT WITH CEMENTED CARBIDE TIP, RIGHT HAND, MODEL NO. 39 - 2, 16X16X120 MM | TOOL, SINGLE POINT WITH CEMENTED CARBIDE TIP, MODEL 39 RIGHT, NO=2, SIZE=16X16X120MM |
| 650828 | CONVEX RULES, ( TAPE RULES ) 5 M / 16" | Tape Rules, Length 5 mtr /16' |
| 650873 | Tape,oil gauge, Stainless steel, Metric, 30 meter | TAPE, OIL GAUGE, STAINLESS STEEL ( 30 M ) |
| 650890 | WATER FINDING PASTE, 75 GRM | Water finding paste |
| 651501 | PRESSURE GAUGE,RIMLESS CASE,HEAT AND VIBRATION RESISTAN TYPE, T-TYPE, PF3/8, 75MM DIAMETER, 0-10 BAR | PRESSURE GUAGE, B-TYPE, M, T-TYPE, PF-1/2 THREAD, DIAM=75MM, RANGE=0-4MPA /// PRESSURE GUAGE, B-TYPE, M, T-TYPE, PF-1/4 THREAD, DIAM=75MM, RANGE=0-4MPA /// PRESSURE GUAGE, B-TYPE, M, T-TYPE, PF-3/8 THREAD, DIAM=75MM, RANGE=0-4MPA |
| 670106 | STEEL ROUND, COLD FINISHED, DIAM=10MM X 4 MTR | STEEL ROUNDS, COLD FINISHED, D=10MM X 12MTR |
| 670116 | Steel round bar, size : Diam 20 mm x L 6 mtr | STEEL ROUNDS, COLD FINISHED, D=20MM X 6MTR |
| 670605 | Steel equal angle-hot rolled, size 40 x 40 x 3 x 1.83 | Angle bar 4x4 /// Steel Equal Angles, hot rolled, 40mmx40mmx3mm |
| 670607 | Steel equal angle-hot rolled, size 50 x 50 x 3 x 3.06 | Angle bar 5x5 /// Steel Equal Angles, hot rolled, 50mmx50mmx4mm |
| 670608 | Steel Equal Angles - Hot Rolled, W 50 x D 50 x T 6 mm x L 6Mtr | Steel Equal Angles - Hot Rolled, W 50 x D 50 x T 6mm x L 6mtr /// Steel equal angles, hot rolled, 50x50x6 mm |
| 670746 | STEEL PALTE, HOT ROLLED, UNGALVANISHED, THICK=5MM, WIDTH=1.219MM X LENGTH=2.438MM | STEEL PLATE, HOT ROLLED, UNGALVANISHED, THICK=5MM, WIDTH=1.219MM X LENGTH=2.438MM /// Steel Plates Hot Rolled T 5mm x W 1,219mm x L 2,438mm |
| 670749 | STEEL PALTE, HOT ROLLED, UNGALVANISHED, THICK=10MM, WIDTH=1.219MM X LENGTH=2.438MM | STEEL PLATE, HOT ROLLED, UNGALVANISHED, THICK=10MM, WIDTH=1.219MM X LENGTH=2.438MM /// Steel Plates Hot Rolled T 10mm x W 1,219mm x L 2,438mm |
| 670751 | Steel Plate Hot Rolled, size: T 12mm x W 1,219mm x L 2,438mm | Steel Plates Hot Rolled T 12mm x W 1,219mm x L 2,438mm |
| 673407 | ZINC CASTING ROUNDS, D=50MM, 1 X 1MTR | Zinc casting round solid 50x 300mm |
| 673803 | Grating, Serrated Style, Galvanized , Size 3' x 20' | Grating, Serrated style, Galvanized, size: 3' x 20' |
| 690302 | Bolt with Nut, Hex head, steel, ungalv size M12 x 50 mm | Bolt with Nut, Hex head, steel, ungalv size M12 x 55 mm |
| 691111 | Bolt with Nut, Hex head, steel, ungalv size M8 x 30 mm | Hexagon bolt with nut M6X30mm |
| 691183 | Bolt with Nut, Hex head, steel, ungalv size M10 x 50 mm | BOLT WITH NUTH, HEX HEAD, STEEL, UNGALV, M10 X 50MM /// Hexagon bolt with nut M10x50mm |
| 691189 | BOLT WITH NUT, HEX HEAD SET SCREW, STEEL UNGALV, M10 X 80mm | Bolt with Nut, Hex head, steel, ungalv size M10 x 30 mm /// BOLT WITH NUTH, HEX HEAD, STEEL, UNGALV, M10 X 80MM |
| 691228 | BOLT WITH NUT, HEX HEAD SET SCREW, STEEL UNGALV, M12 X 80mm | Bolt with Nut, Hex head, steel, ungalv size M12 x 30 mm /// BOLT WITH NUTH, HEX HEAD, STEEL, UNGALV, M12 X 80MM |
| 691230 | Bolt + nut, Hexagon head, Galvanis, M12 x 90 mm | Hexagon bolt with nut M12x90mm |
| 691287 | BOLT WITH NUT, HEX HEAD SET SCREW, STEEL UNGALV, M16 X 80mm | BOLT WITH NUTH, HEX HEAD, STEEL, UNGALV, M16 X 80MM |
| 691359 | Bolt with Nut, Hex head, steel, ungalv size M22 x 60 mm | Hexagon bolt with nut M22x60mm |
| 692923 | Stainless steel bolt with nut ( M16 x 60mm) | Bolt & nut , Hex.Head SUS,M16 x 60mm |
| 692925 | Bolt with nut, Hex head, Stainless steel, M16 x 70 mm, spanner opening 24mm | Bolt & nut , Hex.Head SUS,M16 x 70mm /// Bolt with nut, Hex head, Stainless Steel, size M16 x 70 mm |
| 694801 | Plain Washer, Material stainless steel SUS 304, Outer diamater : 38 mm, Inner diamater : 22 mm, thickness : 3 mm (for bolt M20) | Plain Washer, Material stainless steel SUS 304, Outer diamater : 44 mm, Inner diamater : 27 mm, thickness : 3 mm (for bolt M24) /// Plain Washer, Material stainless steel SUS 304, Outer diamater : 58 mm, Inner diamater : 29 mm, thickness : 3 mm (for bolt M27) /// Round Washer, Material stainless steel SUS 304, Outer diamater 58 mm, Inner diamater : 29 mm, thickness : 3 mm |
| 695001 | Double flap washer d10mm | Double flap washer d8mm |
| 696701 | Ship's steel pipe U-bolts, size: 15A x OD 21,7mm x M10 | Ship's steel pipe U-bolts, size: 40A x OD 48,6mm x M10 |
| 710104 | Carbon Steel pipe for ordinary piping, galvanize size 40A x 11/2 x 48.6x 3.5 x 3890 mm | Carbon Steel pipe for ordinary piping, galvanize size 15A x 1/2 x 21,7 mm /// Carbon Steel pipe for ordinary piping, galvanize size 50A x 2 x60.5 x 3.8 x 5310 mm /// Carbon Steel pipe for ordinary piping, galvanize size 80A x 3 x 89.1 x 4.2 x 8790 mm |
| 710106 | Carbon Steel pipe for ordinary piping, galvanize size 25A X 1 X 34 x 3.2 x 2430 mm | PIPE, CARBON STEEL, GALVANIZED, SIZE=A25, B1, LENGTH=6 MTR |
| 710429 | Carbon steel pipes for high pressure service Sch.80 - 15A for hydraulic line | Carbon steel pipes for high pressure service |
| 710433 | Pipe, Carbon steel pipes for high pressure service, Seamless | Carbon steel pipes for high pressure service |
| 731453 | STEEL BUTT-WELDING ELBOWS, 90ᵒ LONG RADIUS, FOR HIGH PRESSURE SERVICE PIPE, SCHED.40, SIZE=A25 | STEEL BUTT,WELDING ELBOW, 90⁰ LONG RADIUS,HP SERVICE PIPE,SC40,25A |
| 734003 | BRASS FLARELESS MALE CONNECTOR, TUBE O.D=6MM, THREAD END=1/4PT | Brass Flareless Male Connector, Size OD 6mm x PT1/4 |
| 734022 | BRASS FLARELESS UNION, TUBE O.D=6MM, THREAD NUT=1/4 | Brass Flareless Unions, size 6mm x 1/4PT |
| 734024 | BRASS FLARELESS UNION, TUBE O.D=10MM, THREAD NUT=3/8 | Brass Flareless Unions, size 10mm x 3/8PT |
| 734602 | Slip on welding steel pipe flanges, size 15 x 1/2 x 21.7 x 22.2 x 80 x 9 x 60 x 4 mm | SLIP-ON WELDING STEEL PIPE FLANGE. 10K 15A |
| 734624 | FLANGE, STEEL, SLIP-ON WELDING, 16KGF/CM2, JIS B 2220, 16K-25 | SLIP-ON WELDING STEEL PIPE FLANGE. 10K 25A |
| 734704 | Flange 1" 5K sus 304 | Flange 1" 5K steel |
| 751714 | Angle hose valve, bronze flange & couplng, 10K-40mm, JIS F-7334, Nakajima system coupling | Hose valve, ANGLE bronze, Pressure , JIS F-7334, SIZE 40mm |
| 751718 | Globe hose valve, bronze flange & coupling, 10K-65mm, JIS F-7334, Nakajima system coupling | Hose valve, ANGLE bronze, Pressure , JIS F-7334, SIZE 65mm |
| 770447 | Bearing No. 6409 | 6409 |
| 770763 | 6312 ZZC3 | 6312 ZZCM |
| 790185 | LAMP, CLEAR, VIBRATION SERVICE, E-26, 110VOLT, 60WATT | LAMP, CLEAR,VIBRATION SERVICE, E26, 110-120V, 60 WATT |
| 790521 | PILOT LAMP, TUBULAR, BASE E-12, CLEAR, D13XL33MM, 28VOLT, 0.11A | PILOT LAMP, TUBULAR, E-12, CLEAR,DIA 13X33 MM, 28 V, 0.11 WATT |
| 791432 | Fluorescent lamp, daylight colour, FL-20SSCW/18-24, 110V, 18 Watt (Dia : 27 X Length 588.5 mm) | Fluorescent lamp, daylight colour, FL-20SSCW/18-24, 18 Watt (Dia : 27 X Length 588.5 mm) |
| 791504 | Phillips Starter for Flourescent Lamps S10-P 4-65Watt | STARTERS FOR FLUORESCENT LAMPS, FG-1P |
| 791505 | Stater for Flourencent Lamps, FG-4P fol FL 40 watts | Starter for FL /// STARTERS FOR FLUORESCENT LAMPS, FG-4P |
| 791557 | FL LAMP BALLAST, FBM-T, 40 WATT, 100V, 60HZ, 0.970A | FL LAMP BALLAST, FBM-T40,100V, 60HZ, 0.970A |
| 792402 | Dry Batteries (Type-C) , R14P, 1.5V, 26.2x50.0mm | Dry Batteries, R14P, 1.5V, 26.2x50.0mm |
| 792403 | Dry Batteries, AA, 1.5, 14.5x50.5mm | Dry batteries R6P(UM-3) AA /// Dry Batteries, AA, 1.5V |
| 792405 | Dry Batteries, 6F22 (S-006P), 9.0V, 26.5x17.5x48.5mm | DRY BATTERIES, TYPE=6F22(S-006P), 9VOLT |
| 792410 | Dry Batteries, AAA, 1.5, 10.5x44.5mm | Dry batteries R03(UM-4) AAA /// Dry Batteries, AAA, 1.5V |
| 792423 | Alkaline Battery type AA | Battery AAA |
| 792901 | NON WATERTHIGHT TYPE PLUGS & RECEPTACLES, UB | Non-Watertight Type Plugs Class U Type B |
| 792923 | Non-Watertight Receptacles Double, 2 Round Pin "Siemens". | Double Receptacle /// RECEPTACLE, DOUBLE, 2 ROUND PIN "SIEMENS" |
| 794855 | Nylon Cable Ties 3.6 x 300mm | PLASTIC CABLE BANDS 300MM /// Plastic cable Ties 150 /// Plastic cable Ties 300 |
| 795431 | PVC INSULATION TAPE, BLACK, BLUE, RED, W=19MM, L=20MTR, PER-COLOUR X 15/COLOUR | Insulation Electrical Tape 19mm x 20 mtr /// P.V.C INSULATION TAPE, BLACK /// P.V.C Insulation Tapes, 19 mm x 20 mtr/spool |
| 795433 | 3M Scotch Vinyl Electrical Tape (black) | Insulation Tapes Black /// Insulation Tapes Red |
| 795496 | Heat shrink tube 2mm (black) | Heat shrink tube 4mm (black) |
| 795501 | Insulation Putty, 1kg / pkt | PUTTY INSULATION 1KG |
| 795511 | Electric Contact Cleaner 260ml | Contact Cleaner |
| 795523 | INSULATION VARNISH, RED , SPRAY, 300CC | INSULATION VARNIS,RED, Spray 300 cc |
| 811075 | NON-ASBESTOS GASKET JOINT SHEETS, THICK=2.0, SIZE=1.200MM X 1.200 MM | Non asbestos gasket joint sheet, T2.0mm /// Non Asbestos Sheet Gasket. T=2.0mm |
| 811113 | NATURAL RUBBER JOIN SHEET, THICK=2.0MM, SIZE=1.000MM X 1.000MM | Natural Rubber Joint Sheet. T=2.0mm /// Natural Rubber joint sheets 2mm |
| 811114 | Natural rubber joint sheets, thickness 3.0 mm, sheet size 1000 x 1000mm | NATURAL RUBBER JOIN SHEET, THICK=3.0MM, SIZE=1.000MM X 1.000MM /// Natural Rubber joint sheets 3mm |
| 811115 | NATURAL RUBBER JOIN SHEET, THICK=4.0MM, SIZE=1.000MM X 1.000MM | Natural Rubber Joint Sheet. T=4.0mm |
| 811116 | Natural rubber joint sheets, thick 5.0mm, size 1000 x 1000 mm | Rubber packing 5mm |
| 811295 | GS NON-ASBESTOS JOINTING 178, APP FOR STEAM, THICK=2.0, SIZE=1.500MM X 1.500MM | Non asbestos jointing 178. 2x1500x1500 mm |
| 811296 | GS NON-ASBESTOS JOINTING 178, APP FOR STEAM, THICK=3.0, SIZE=1.500MM X 1.500MM | Non asbestos jointing 178. 3x1500x1500 mm |
| 811676 | BRAKE LINING, NON ASBESTOS, 10MM x 1000MM x 1400MM | BRAKE LINING, NON ASBESTOS, 10MM x 800MM x 1400MM |
| 811702 | GLASS CLOTHS, THICKNESS 1.7MM, WIDTH 1.000MM, WEIGHT 1.000 G/M2 | Glass Fibre Spinning & Textile T=1.7mm. /// GLASS FIBRE SPINNING & TEXTILE, GLASS CLOTHS, 1.7x1000x1000 |
| 812251 | Devcon Plastic Steel Putty (A), 500 grm/unit | Devcon plastic steel A, 500 g/unit /// DEVCON PLASTIC STEEL A, 500 GRM/UNIT |
| 812306 | Cordobond Strong-back Putty, 226 grm/unit | Cordobond strong back putty |
| 812471 | Anti Corrosive Tapes W= 50mm x L= 10 Meters | Anti corrosive tape width 50 mm /// Combination pliers |
| 812501 | TEFLON SEAL TAPES, WIDTH=13MM, THICK=0.1MM, ROLL=5MTR, | Seal tape /// Tape seal teflon 0.1x13mmx5mtr /// Teflon seal tapes 13mm x 0,1mm x 5mtr |
| 812602 | Silicone Sealant, Clear, 350 grm | Silicone Sealant, Clear /// SILICONE SEALANT, CLEAR, 350GRM, |
| 812622 | THREE BOND 1101 NON-SOLVENT AND HARMLESS 1KG | SEALING AGENTS, THREE BOND 1100 SERIES |
| 812703 | GENERAL PURPOSE GLUE, 1.0 KG | General purpose glue |
| 813102 | Air filter (Viledon Filter) Size 15 x 1600 mm | AIR FILTER,T15 MM,W 1.600 MM /// AIR FILTERS, THICK=15MM, WIDTH=1.600MM |
| 813312 | GUAGE GLASS, ROUND, DIAM=16MM, THICK=4MM, LENGTH=2000MM | GAUGE GLASS, ROUND, ACRYLIC, 16x4x1000 MM |
| 850192 | Oxygen Regulator with Female Thread 22 x 14 | REGULATOR,FOR OXYGEN, 22 X 14 MM, FEMALE |
| 850462 | FLUX COATED SILVER SOLDER, DIA=2.0, LENGTH=450MM, FOR JOINING ALL FERROUS AND COPPER METAL, STEEL CASTINGS, ETC. | Flux Coated Silver Solder 2.0 mm |
| 851116 | Welding helmets with headgear | WELDING HELMET WITH HEADGEAR |
| 851163 | Welders' gloves, type : 5 fingers | Allen Key 14 /// WELDERS GLOVES, 5 FINGERS /// Welders' Gloves, Five Fingers /// Welding Gloves |
| 851327 | ELECTRODE, FOR WELDING OF STEELS AND LIGHT STRUCTURES, RB-26. 2.6 MM, 350 MM, WEGHT 5.0 KG | Electrode,RB-26, 2.6mm /// Electrodes, kobe steel products size Rb-26 x 2.6 x 350 x 5.0 kg /// Welding electrodes, Brand RB-26, size: D 2,6 mm x 350mm x 5 Kg |
| 851328 | ELECTRODE, FOR WELDING OF STEELS AND LIGHT STRUCTURES, RB-26. 3.2 MM, 350 MM, WEGHT 5.0 KG | Electrode,RB-26, 3.2mm /// Electrodes RB 26 D = 3.2 mm 5.0 Kgs/pkt /// Electrodes, kobe steel products size Rb-26 x 3.2 x 350 x 5.0 kg |
| 851332 | Electrodes, kobe steel products size Lb-26 x 2.6 x 350 x 5.0 kg | Electrode RB-2.6 mm |
| 851333 | Electrodes, kobe steel products size Lb-26 x 2.6 x 350 x 5.0 kg | Electrode RB-3.2 mm /// Electrodes LB 52 D = 3.2 mm 5.0 Kgs/pkt |
