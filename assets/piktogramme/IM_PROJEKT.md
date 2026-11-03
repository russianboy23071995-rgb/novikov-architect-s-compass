# Piktogramme im Projekt

Quellpaket der Piktogramme für Werkzeugleiste, Zeichenarten und Navigator (docs/WERKZEUGLEISTE.md, WL3). Die Anleitung des Pakets steht in `LIESMICH.md`.

- Die Software nutzt die farbneutralen Dateien unter `src/assets/piktogramme/{inaktiv,aktiv}/{navigator,werkzeuge}/`. Das sind die Dateien aus `svg/currentColor/` des Pakets.
- Die Farben kommen aus der Oberfläche: inaktiv die Textfarbe, aktiv `--pikto-aktiv` in `src/styles.css`. Die Werte in `farben.json` gelten nur für die festen Varianten `hell/` und `dunkel/` des Pakets; die Software nutzt sie nicht.
- **Neu erzeugen:**
  1. In diesem Ordner `py -3 erzeugen.py` ausführen.
  2. Danach `svg/currentColor/inaktiv` und `svg/currentColor/aktiv` nach `src/assets/piktogramme/` kopieren.

  Die erzeugten Ordner `svg/`, `css/` und `vorschau.html` sind nicht im Repository.
