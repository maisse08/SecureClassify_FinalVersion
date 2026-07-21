export interface ComputeCIAParams {
    confidentialite: number;
    integrite: number;
    disponibilite: number;
    methodeCalcul: "MAX" | "MOY";
}

export interface CIAResult {
    niveauGlobal: number;
    ciaMax: number;
    ciaAvg: number;
    classification: "Public" | "Internal" | "Confidential" | "Highly Confidential";
    protectionRequired: "Basic protection" | "Standard protection" | "Enhanced protection" | "Maximum protection";
}

export const calculateCIA = ({ confidentialite, integrite, disponibilite, methodeCalcul }: ComputeCIAParams): CIAResult => {
    const values = [confidentialite, integrite, disponibilite];
    const ciaMax = Math.max(...values);
    const ciaAvg = Number(((confidentialite + integrite + disponibilite) / 3).toFixed(2));
    const niveauGlobal = methodeCalcul === "MAX" ? ciaMax : ciaAvg;

    let classification: CIAResult["classification"] = "Public";
    let protectionRequired: CIAResult["protectionRequired"] = "Basic protection";

    if (niveauGlobal >= 4) {
        classification = "Highly Confidential";
        protectionRequired = "Maximum protection";
    } else if (niveauGlobal >= 3) {
        classification = "Confidential";
        protectionRequired = "Enhanced protection";
    } else if (niveauGlobal >= 2) {
        classification = "Internal";
        protectionRequired = "Standard protection";
    } else {
        classification = "Public";
        protectionRequired = "Basic protection";
    }

    return {
        niveauGlobal,
        ciaMax,
        ciaAvg,
        classification,
        protectionRequired,
    };
};

export default calculateCIA;
