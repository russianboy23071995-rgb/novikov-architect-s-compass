# IFC-Abnahme: rechtwinkliges Wandpaar

Stand: 05.10.2026. Isolierter Testexport, noch keine gespeicherte Verbindung oder
neue Aktion im normalen CAD-Export. Die Paarauswahl wird dem Testexport explizit
ueber zwei stabile Wand-IDs und Endpunktindizes uebergeben. Die Projektdatei
speichert diese temporaere Auswahl nicht als Anschluss.

## Praktischer Archicad-Test

`NOVIKOV-Eckanschluss-Test.ifc` in einem separaten Testprojekt importieren.
Erwartet: zwei Waende mit je 3,00 m Zeichenachsenlaenge, 0,36 m Staerke und
2,80 m Hoehe. Achse A: (0;0) bis (3;0), Achse B: (3;0) bis (3;3).
Beide Koerper sind zentriert. Die gemeinsame Gehrung verlaeuft von
(2,82;0,18) bis (3,18;-0,18). Die Koerper beruehren sich dort ohne Volumenueberlappung.

1. Im Grundriss pruefen: geschlossene Ecke ohne Spalt und ohne ueberschneidende Koerper.
2. In 3D pruefen: zwei durchgehende Fensteroeffnungen; je 1,20 x 1,35 m,
   Bruestung 0,90 m, mittig bei Achsposition 1,50 m.
3. Bauteilinformationen pruefen: SourceIds A/B bzw. window-A/window-B,
   Nettovolumen je Wand 2,4408 m3, Summe 4,8816 m3.
4. Importversion, IFC-Uebersetzer und etwaige Abweichungen notieren.

Die Fenster sind semantische IFC-Fenster mit verknuepften echten Oeffnungen;
Rahmen und Glas werden weiterhin nicht erfunden. Die Konvertierung in native
Archicad-Bauteile haengt vom Importer ab. Der Import dieses neuen Testmodells
ist noch nicht bestaetigt; fruehere erfolgreiche IFC-Imports ersetzen diese Abnahme nicht.

## Reproduzierbare Erzeugung und Pruefung

```sh
node --experimental-strip-types scripts/generate-corner-ifc-fixtures.mjs <output-directory>
python -m pip install ifcopenshell==0.8.5 pytest
python scripts/validate-ifc.py <output-directory>
```

Python-Pakete in einer separaten Pruefumgebung installieren, keine Runtime-Abhaengigkeit.
Der Generator erzeugt 12 IFCs mit JSON-Pruefdaten: neun Kombinationen aus
-0,18/0/+0,18 m Koerperversatz, dazu Drehung/Translation, Achsumkehr und
ueberlappende Oeffnungen. Die JSON-Dateien enthalten Referenzwerte sowie ein
Projekt und Testziele; sie sind keine normalen NOVIKOV-Projektdateien.

Nachweis: alle 12 Dateien bestanden IfcOpenShell 0.8.5 einschliesslich EXPRESS,
Einheiten, Hierarchie, Platzierung, Profilkoordinaten in lokalem/Weltbezug,
Oeffnungsbeziehungen und unabhaengig berechnetem Nettovolumen. Vier neue Node-Tests
pruefen explizite Profilauswahl, unbeeinflusste andere Waende, stabile IFC-Identitaet,
Snapshot-Isolation und abgewiesene ungueltige Profile/Ziele/Oeffnungen.
437 Tests insgesamt; TypeScript/Build erfolgreich; Lint 0 Fehler/6 bekannte Warnungen.
Normaler Beispiel-IFC-Export bytegleich zum Stand vor der Writer-Verlagerung.

## Architektur und Grenzen

`interop/ifc/writer.ts` ist der gemeinsame STEP-Schreiber; `lib/bim/ifc.ts`
bleibt der kompatible regulaere Einstieg. `interop/ifc/corner.ts` validiert den
Snapshot, ruft `deriveCornerSolids` auf und uebergibt ausschliesslich die dort
verwendeten lokalen Bruttokonturen. Keine zweite Gehrungsberechnung. Oeffnungen
werden im gemeinsamen Writer aus denselben Fensterparametern verknuepft.

Nur das explizite Paar erhaelt Polygonprofile, andere Waende bleiben rechteckig.
Unterstuetzt sind die bestehenden rechtwinkligen Paare gleicher Hoehe/Staerke
mit voll enthaltenen Oeffnungen. Beruehrung/Endueberschreitung wird im Testpfad
abgewiesen; daraus folgt keine neue fachliche Produktentscheidung.
Keine persistente Verbindung, Verbindungshistorie, automatische Nachbarsuche
oder UI-Freischaltung. Offene Regeln zu Endkappen beim Loesen und
Oeffnungsberuehrung bleiben offen.

IFC4-Grundlage: [IfcArbitraryClosedProfileDef](https://standards.buildingsmart.org/IFC/RELEASE/IFC4/ADD2_TC1/HTML/schema/ifcprofileresource/lexical/ifcarbitraryclosedprofiledef.htm)
fuer geschlossene 2D-Profile; [IfcRelVoidsElement](https://standards.buildingsmart.org/IFC/RELEASE/IFC4/ADD2_TC1/HTML/schema/ifcproductextension/lexical/ifcrelvoidselement.htm)
fuer den Abzug der mit einem Host verknuepften Oeffnung. Die Pruefung ist keine
Zertifizierung und ersetzt den konkreten Importtest nicht.

## Nutzerabnahme Archicad — 05.10.2026

Der Nutzer bestaetigt den Import des bereitgestellten Eckmodells als vollstaendig
korrekt: Fenster und rechtwinkliger Wandanschluss stimmen. Damit ist die oben
als ausstehend bezeichnete praktische Abnahme dieses Testmodells abgeschlossen.
Dies ist die Nutzerabnahme, kein durch Codex selbst ausgefuehrter Archicad-Test.
