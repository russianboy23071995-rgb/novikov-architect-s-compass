# K07a: Kamera und Picking im bestehenden 3D-Renderer

08.10.2026. PR198 nach erfolgreicher GitHub-CI zusammengefuehrt.
Produktcode, Modell und Bedienung bleiben unveraendert.

## Reproduzierbarer Umfang

Diagnoseserver starten, /benchmarks/solid-profile.html oeffnen, Diagnose starten.
Der nur im Diagnose-Vite konfigurierte Plugin solid-instrumentation exportiert
createRenderer aus BimSolidView und umschliesst dessen unveraenderten
Projektions-/Packblock und bufferData-Aufruf mit bestehenden Messklammern.
Jeder Textersatz muss genau einmal passen, sonst bricht die Diagnose ab.
Produktbuild importiert weder Plugin noch Messseite. Kein eigener Renderer.

Gueltige Eckketten mit 25/100/500 Waenden, je einem Fenster; 1/2/4 getrennte
WebGL-Kontexte, 400x300 Backbuffer pro Ansicht. Zwei Warmlaeufe, zehn wechselnde
Kamerazustaende pro Fall. Unselektiert, keine Umrandungen oder Hover-Inferenz.
Alle Ansichten werden seriell neu gezeichnet: bewusster Summenlastfall, keine
Behauptung, dass jede Kameraaenderung im Produkt alle Ansichten aktualisiert.
Aufbau buildSolid einmal vor der Ansichtsserie; React-Mounts koennen weitere
Ableitungen verursachen, diese sind hier nicht erfasst.

Picking: ein NDC-Mittelpunkt pro Ansicht/Kamerazustand mit pickSolidElement,
einschliesslich Fensterflaechen. Projektionsaufrufe werden mitgezaehlt. Kein
vollstaendiger Clickpfad mit vorheriger Fusspunkt-/Sichtbarkeitsabfrage.
21 Kontrollvergleiche je Gesamtlauf gegen frisch abgeleitete Solid-Geometrie und
Picking derselben Projektion; alle Quell-Wand-IDs bekannt, Modell und Solid nach
Messung unveraendert. Keine alternative Picking-Implementierung oder pixelgenaue
GPU-Abnahme behauptet. Kontrolle auch bei einem Nulltreffer kein Auswahlbeweis.

## Ergebnisse

Zwei lokale Browserlaeufe bestanden. [Erster Lauf](solid-profile.json),
[Wiederholung](solid-profile-repeat.json), mit Rohsamples und Browserkennung.
Zeiten in ms, Mediane der zehn Samples; Tabelle zeigt Wiederholung.

| Waende | Ansichten | Draw CPU gesamt | Projektion + Packen | Pufferuebergabe | Picking gesamt |
| --- | --- | --- | --- | --- | --- |
| 25 | 1 | 5,80 | 5,60 | 0,10 | 1,70 |
| 100 | 1 | 10,10 | 9,75 | 0,30 | 3,80 |
| 100 | 4 | 38,60 | 37,00 | 1,40 | 15,00 |
| 500 | 1 | 49,05 | 47,50 | 1,40 | 19,85 |
| 500 | 4 | 201,60 | 195,55 | 5,90 | 75,75 |

Erster Lauf 500/1: 58,50 / 57,00 / 1,40 / 25,95 ms. Absolute Zeiten schwanken;
beide Laeufe zeigen denselben Schwerpunkt im CPU-Projektions-/Packblock.
Einmaliger Solidaufbau 500: 150,3 bzw. 103,8 ms. Keine verallgemeinerte
Kapazitaetsgarantie fuer komplexe Gebaeude oder andere Hardware.

bufferData-Zeit enthaelt Float32Array-Erzeugung und CPU-Uebergabe, nicht die
asynchrone GPU-Ausfuehrung. gl.finish wurde bewusst nicht als Normalpfad benutzt.
Draw umfasst Projektionspacken, GPU-Kommandos und Zustand; keine Raster-/GPUzeit.
Kein React-/Eingabe-zu-Pixel-Nachweis. 4 Ansichten haben insgesamt vierfache
Backbufferflaeche. UI, Orientierungsebene und Snap koennen weitere Kosten addieren.

694 vorhandene Tests bestanden; Diagnose-Typecheck (inklusive src), gezielter
ESLint und Produktionsbuild erfolgreich. Bestehende Vite-/Chunkwarnungen bleiben.

## Entscheidung und genau ein Folgeauftrag

K07b: Isolierter Pilot fuer wiederverwendbare Weltgeometriepuffer und eine
Kameramatrix im bestehenden WebGL-Shader. Nur Kamerabewegung bei unveraenderter
Geometrie, Sichtbarkeit und Auswahl zuerst vergleichen. Projektion, Tiefe,
Fensteroeffnungen und stabile IDs muessen mit dem bisherigen Pfad uebereinstimmen;
mehrere Kontexte, Resize/DPR und Context-Verlust als Grenzen festhalten.
Bestehendes CPU-Picking bleibt Referenz. Noch keine produktive Umstellung.

Begruendung: Projektion und Arrayaufbereitung dominieren die gemessene Drawzeit.
Nur bufferData zu vermeiden greift zu kurz. Ein Rendererwechsel ist dadurch
nicht gerechtfertigt. Picking bleibt messbar teuer, wird aber nicht gleichzeitig
mit dem Kamera-Piloten umgebaut. Andere K-/V-Ziele bleiben erhalten.
