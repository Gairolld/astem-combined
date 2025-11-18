import i18n from "i18next";
import { initReactI18next } from "react-i18next";
//enlgish namspaces
import enFilebar from "../locales/en/filebar.json";
import enInspector from "../locales/en/inspector.json";
import enAnnotationScrollbar from "../locales/en/annotationScrollbar.json";
import enCommon from "../locales/en/common.json";
import enloadBar from "../locales/en/loadingBar.json";
import enApp from "../locales/en/app.json";

//japanese namespaces
import jaFilebar from "../locales/ja/filebar.json";
import jaInspector from "../locales/ja/inspector.json";
import jaAnnotationScrollbar from "../locales/ja/annotationScrollbar.json";
import jaCommon from "../locales/ja/common.json";
import jaloadBar from "../locales/ja/loadingBar.json";
import jaApp from "../locales/ja/app.json";



i18n
    .use(initReactI18next)
    .init({
        resources: {
            en: {
                filebar: enFilebar,
                inspector: enInspector,
                annoScrollbar: enAnnotationScrollbar,
                common: enCommon,
                loadBar: enloadBar,
                app: enApp,
            },
            ja: {
                filebar: jaFilebar,
                inspector: jaInspector,
                annoScrollbar: jaAnnotationScrollbar,
                common: jaCommon,
                loadBar: jaloadBar,
                app: jaApp,
            }
        },
        lng: "ja",
        fallbackLng: "ja",
        ns: ["common", "filebar", "inspector","annoScrollbar","loadBar","app"],  // namespaces available
        defaultNS: "common",
        interpolation: { escapeValue: false }
    });

export default i18n;