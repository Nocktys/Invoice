const express = require("express");
const axios = require("axios");
const pdf = require("pdfkit");
const fs = require("fs");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static("public"));

const OAuth = require("oauth-1.0a");
const crypto = require("crypto");

const API_CONSUMER_KEY = "Your Consumer Key";
const API_CONSUMER_SECRET = "Your Consumer Secret";
const API_TOKEN = "Your API Token";
const API_TOKEN_SECRET = "Your API Token Secret";

const oauth = OAuth({
  consumer: { key: API_CONSUMER_KEY, secret: API_CONSUMER_SECRET },
  signature_method: "HMAC-SHA1",
  hash_function(base_string, key) {
    return crypto.createHmac("sha1", key).update(base_string).digest("base64");
  },
});

async function getOrder(orderId) {
  const request_data = {
    url: `https://api.bricklink.com/api/store/v1/orders/${orderId}`,
    method: "GET",
  };

  const authHeader = oauth.toHeader(
    oauth.authorize(request_data, {
      key: API_TOKEN,
      secret: API_TOKEN_SECRET,
    })
  );

  try {
    const response = await axios.get(request_data.url, {
      headers: {
        ...authHeader,
        "Content-Type": "application/json",
      },
    });

    console.log(
      "🔍 Données brutes de la commande :",
      JSON.stringify(response.data, null, 2)
    );
    return response.data;
  } catch (error) {
    console.error("❌ Erreur API:", error.response?.data || error.message);
    return null;
  }
}

async function getOrderItems(orderId) {
  const request_data = {
    url: `https://api.bricklink.com/api/store/v1/orders/${orderId}/items`,
    method: "GET",
  };

  const authHeader = oauth.toHeader(
    oauth.authorize(request_data, {
      key: API_TOKEN,
      secret: API_TOKEN_SECRET,
    })
  );

  try {
    const response = await axios.get(request_data.url, {
      headers: {
        ...authHeader,
        "Content-Type": "application/json",
      },
    });

    console.log("📦 Réponse brute API articles :", response.data); // Ajout du log
    return response.data;
  } catch (error) {
    console.error(
      "❌ Erreur API articles:",
      error.response?.data || error.message
    );
    return null;
  }
}
app.get("/generate-invoice/:orderId", async (req, res) => {
  const order = await getOrder(req.params.orderId);
  const itemdata = await getOrderItems(req.params.orderId);

  if (!order || !order.data) {
    return res.json({ error: "Commande introuvable ou erreur API." });
  }

  if (!itemdata || !itemdata.data || itemdata.data.length === 0) {
    return res.json({ error: "Articles introuvables ou erreur API articles." });
  }

  // Extraction des données client
  const DateOrdered = new Date(order.data.date_ordered).toLocaleDateString(
    "fr-FR"
  );
  const customerPseudo = order.data.buyer_name || "Nom inconnu";
  const customerName =
    order.data.shipping?.address?.name?.full || "Nom inconnu";
  const customerAddress1 = order.data.shipping?.address?.address1 || "";
  const customerAddress2 = order.data.shipping?.address?.address2 || "";
  const customerCountryCode =
    order.data.shipping?.address?.country_code || "Pays inconnu";
  const customerCity = order.data.shipping?.address?.city || "Ville inconnue";
  const customerState = order.data.shipping?.address?.state || "";
  const customerPostal = order.data.shipping?.address?.postal_code || "";

  const colorMap = {
    "Black": "#05131D",
    "Blue": "#0055BF",
    "Green": "#237841",
    "Dark Turquoise": "#008F9B",
    "Red": "#C91A09",
    "Dark Pink": "#C870A0",
    "Brown": "#583927",
    "Light Gray": "#9BA19D",
    "Dark Gray": "#6D6E5C",
    "Light Blue": "#B4D2E3",
    "Bright Green": "#4B9F4A",
    "Light Turquoise": "#55A5AF",
    "Salmon": "#F2705E",
    "Pink": "#FC97AC",
    "Yellow": "#F2CD37",
    "White": "#FFFFFF",
    "Light Green": "#C2DAB8",
    "Light Yellow": "#FBE696",
    "Tan": "#E4CD9E",
    "Light Violet": "#C9CAE2",
    "Glow In Dark Opaque": "#D4D5C9",
    "Purple": "#81007B",
    "Dark Blue-Violet": "#2032B0",
    "Orange": "#FE8A18",
    "Magenta": "#923978",
    "Lime": "#BBE90B",
    "Dark Tan": "#958A73",
    "Bright Pink": "#E4ADC8",
    "Medium Lilac": "#3F3691",
    "Dark Purple": "#3F3691",
    "Dark Blue": "#0A3463",
    "Sand Blue": "#6074A1",
    "Sand Green": "#A3AE9E",
    "Sand Yellow": "#A0A5A9",
    "Earth Blue": "#143044",
    "Earth Green": "#184632",
    "Dark Red": "#720E0F",
    "Dark Orange": "#A95500",
    "Medium Blue": "#6E99C9",
    "Medium Green": "#73DCA1",
    "Light Pink": "#FECCCF",
    "Light Flesh": "#F6D7B3",
    "Milky White": "#FFFFFF",
    "Reddish Brown": "#7A3E22",
    "Dark Stone Gray": "#6C6E68",
    "Medium Dark Flesh": "#CC702A",
    "Medium Stone Gray": "#A0A5A9",
    "Light Stone Gray": "#E5E5E5",
    "Bright Light Orange": "#F8BB3D",
    "Bright Light Blue": "#9FC3E9",
    "Rust": "#B31004",
    "Bright Light Yellow": "#FFF03A",
    "Sky Blue": "#7DBFDD",
    "Dark Blue": "#0A3463",
    "Dark Green": "#184632",
    "Dark Brown": "#352100",
    "Maersk Blue": "#6D9BC3",
    "Dark Red": "#720E0F",
    "Dark Orange": "#A95500",
    "Dark Tan": "#958A73",
    "Dark Purple": "#3F3691",
    "Dark Pink": "#C870A0",
    "Dark Gray": "#6D6E5C",
    "Dark Blue-Violet": "#2032B0",
    "Dark Turquoise": "#008F9B",
    "Dark Green": "#184632",
    "Dark Orange": "#A95500",
    "Dark Red": "#720E0F",
    "Dark Brown": "#352100",
    "Dark Tan": "#958A73",
    "Dark Purple": "#3F3691",
    "Dark Pink": "#C870A0",
    "Dark Gray": "#6D6E5C",
    "Dark Blue-Violet": "#2032B0",
    "Dark Turquoise": "#008F9B",
    "Dark Green": "#184632",
    "Dark Orange": "#A95500",
    "Dark Red": "#720E0F",
    "Dark Brown": "#352100",
    "Dark Tan": "#958A73",
    "Dark Purple": "#3F3691",
    "Dark Pink": "#C870A0",
    "Dark Gray": "#6D6E5C",
    "Dark Blue-Violet": "#2032B0",
    "Dark Turquoise": "#008F9B",
    "Dark Green": "#184632",
    "Dark Orange": "#A95500",
    "Dark Red": "#720E0F",
    "Dark Brown": "#352100",
    "Dark Tan": "#958A73",
    "Dark Purple": "#3F3691",
    "Dark Pink": "#C870A0",
    "Dark Gray": "#6D6E5C",
    "Dark Blue-Violet": "#2032B0",
    "Dark Turquoise": "#008F9B",
    "Dark Green": "#184632",
    "Dark Orange": "#A95500",
    "Dark Red": "#720E0F",
    "Dark Brown": "#352100",
    "Dark Tan": "#958A73",
    "Dark Purple": "#3F3691",
    "Dark Pink": "#C870A0",
    "Dark Gray": "#6D6E5C",
    "Dark Blue-Violet": "#2032B0",
    "Dark Turquoise": "#008F9B",
    "Dark Green": "#184632",
    "Dark Orange": "#A95500",
    "Dark Red": "#720E0F",
    "Dark Brown": "#352100",
    "Dark Tan": "#958A73",
    "Dark Purple": "#3F3691",
    "Dark Pink": "#C870A0",
    "Dark Gray": "#6D6E5C",
    "Dark Blue-Violet": "#2032B0",
    "Dark Turquoise": "#008F9B",
    "Dark Green": "#184632",
    "Dark Orange": "#A95500",
    "Dark Red": "#720E0F",
    "Dark Brown": "#352100",
    "Dark Tan": "#958A73",
    "Dark Purple": "#3F3691",
    "Dark Pink": "#C870A0",
    "Dark Gray": "#6D6E5C",
    "Dark Blue-Violet": "#2032B0",
    "Dark Turquoise": "#008F9B",
    "Dark Green": "#184632",
    "Dark Orange": "#A95500",
    "Dark Red": "#720E0F",
    "Dark Brown": "#352100",
    "Dark Tan": "#958A73",
    "Dark Purple": "#3F3691",
    "Dark Pink": "#C870A0",
    "Dark Gray": "#6D6E5C",
    "Dark Blue-Violet": "#2032B0",
    "Dark Turquoise": "#008F9B",
    "Dark Green": "#184632"
    };
   
  

  // Récupération des articles

  const itemsData = Array.isArray(itemdata) ? itemdata[0] : itemdata;
  console.log(
    "✅ Nouvelle structure de itemsData :",
    JSON.stringify(itemsData, null, 2)
  );

  const items = itemsData.data.flat().map((item) => ({
    name: item.item.name,
    no: item.item.no,
    type: item.item.type,
    color: item.color_name,
    quantity: item.quantity,
    price: item.unit_price,
  }));
  

  // Montants de la commande
  const subtotal = parseFloat(order.data.cost?.subtotal || 0).toFixed(2);
  const shipping = parseFloat(order.data.cost?.shipping || 0).toFixed(2);
  const total = parseFloat(order.data.cost?.grand_total || 0).toFixed(2);

  // Création du PDF
  const doc = new pdf({ margin: 30 });
  const filePath = `public/invoices/invoice_${req.params.orderId}.pdf`;

  if (!fs.existsSync("public/invoices")) {
    fs.mkdirSync("public/invoices", { recursive: true });
  }

  doc.pipe(fs.createWriteStream(filePath));

  // Première section - Titre et logo avec style spécifique
  doc
    .image("public/images/logo.png", 50, 45, { width: 50 })
    .fillColor("#444444")
    .fontSize(20)
    .text("QueenBricks", 110, 57);

  // Réinitialisation des styles avant la prochaine section
  doc
    .fontSize(10)
    .text("QueenBricks", 200, 50, { align: "right" })
    .text("1 Allée du Plateau", 200, 65, { align: "right" })
    .text("01800 Meximieux, Ain, France", 200, 80, { align: "right" })
    .moveDown(2);

  //Informations client

  doc.fillColor("#444444").fontSize(20).text("Facture", 50, 160);

  generateHr(doc, 185);

  const customerInformationTop = 200;

  doc
    .fontSize(10)
    .text("N° de Commande:", 50, customerInformationTop)
    .font("Helvetica-Bold")
    .text(`#${req.params.orderId}`, 150, customerInformationTop)
    .font("Helvetica")
    .text("Date:", 50, customerInformationTop + 15)
    .text(`${DateOrdered}`, 150, customerInformationTop + 15)

    .font("Helvetica-Bold")
    .text(customerName, 300, customerInformationTop)
    .font("Helvetica")
    .text(customerAddress1, 300, customerInformationTop + 15)
    .text(
      customerPostal +
        ", " +
        customerCity +
        ", " +
        customerState +
        ", " +
        customerCountryCode,
      300,
      customerInformationTop + 30
    )
    .moveDown(1);

  generateHr(doc, 252);

  const invoiceTableTop = 330;

  doc.font("Helvetica-Bold");
  generateTableRow(
    doc,
    invoiceTableTop,
    "Couleur",
    "Article",
    "N° Pièce",
    "Coût Unitaire",
    "Quantité",
    "Total"
  );
  generateHr(doc, invoiceTableTop + 20);
  doc.font("Helvetica")

  doc.moveDown(2);

  console.log("📜 Données envoyées dans la facture :", JSON.stringify(items, null, 2));


  let y = invoiceTableTop + 30; // Position initiale
  const lineHeight = 20; // Hauteur de chaque ligne
  const pageHeight = 750; // Hauteur max avant saut de page

  items.forEach((item) => {
    // Vérifier si on dépasse la page
    if (y + lineHeight > pageHeight) {
      doc.addPage();
      y = 50; // Reset de la position en haut de la nouvelle page

      // Ajouter les en-têtes de la table sur la nouvelle page
      generateTableRow(
        doc.font("Helvetica-Bold"),
        y,
        "Couleur",
        "Article",
        "N° Pièce",
        "Coût Unitaire",
        "Quantité",
        "Total"
      );
      generateHr(doc, y + 20);
      y += 30; // Déplacement sous les en-têtes
    }

    // Ajout des données de l'article
    generateTableRowArticles(
      doc.font("Helvetica"),
      y,
      item.color,
      truncateText(item.name, 32),
      item.no,
      `${item.price}€`,
      item.quantity,
      `${(item.quantity * item.price).toFixed(2)}€`
    );

    generateHr(doc, y + lineHeight - 5); // Ligne de séparation sous chaque item
    y += lineHeight; // Déplacement pour la prochaine ligne
  });

  function generateHr(doc, y) {
    doc
      .strokeColor("#aaaaaa")
      .lineWidth(1)
      .moveTo(50, y)
      .lineTo(550, y)
      .stroke();
  }

  function generateTableRow(
    doc,
    y,
    color,
    item,
    description,
    unitCost,
    quantity,
    lineTotal
  ) {
    doc
      .fontSize(10)
      .text(color, 50, y)
      // .fillColor(getHexColor(color))
      // .rect(50, y , 10, 10)
      // .fill()
      // .fillColor("#444444") // Remet la couleur normale pour le reste du texte 
      .text(item, 100, y)
      .text(description, 290, y)
      .text(unitCost, 340, y, { width: 90, align: "right" })
      .text(quantity, 410, y, { width: 90, align: "right" })
      .text(lineTotal, 460, y, { width: 90, align: "right" });
  }
  function generateTableRowArticles(
    doc,
    y,
    color,
    item,
    description,
    unitCost,
    quantity,
    lineTotal
  ) {
    doc
      .fontSize(10)
      .fillColor(getHexColor(color))
      .rect(50, y , 10, 10)
      .fill()
      .fillColor("#444444") // Remet la couleur normale pour le reste du texte 
      .text(item, 100, y)
      .text(description, 290, y)
      .text(unitCost, 340, y, { width: 90, align: "right" })
      .text(quantity, 410, y, { width: 90, align: "right" })
      .text(lineTotal, 460, y, { width: 90, align: "right" });
  }

  function truncateText(text, maxLength) {
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  }

  if (doc.y > 650) doc.addPage(); // Si trop bas, on ajoute une page

  // Totaux alignés avec la colonne "Total"
  const totalStartY = doc.y + 20; // Ajoute un peu d'espace après la dernière ligne du tableau

  doc
    .font("Helvetica-Bold")
    .fillColor("#444444")
    .text("Sous-total HT :", 330, totalStartY, { width: 150, align: "right" })
    .text(`${subtotal}€`, 500, totalStartY, { width: 50, align: "right" })
    .text("Frais d'envoi :", 330, totalStartY + 15, {
      width: 150,
      align: "right",
    })
    .text(`${shipping}€`, 500, totalStartY + 15, { width: 50, align: "right" })
    .fontSize(14)
    .text("Montant Total HT :", 330, totalStartY + 35, {
      width: 150,
      align: "right",
    })
    .text(`${total}€`, 500, totalStartY + 35, { width: 50, align: "right" })
    .font("Helvetica")
    .moveDown(2);

  // Vérification avant d'ajouter le pied de page
  if (doc.y > 700) doc.addPage();

  // Pied de page informations légales
  doc
    .fontSize(8)
    .fillColor("#aaaaaa") // Gris clair
    .text(
      "Auto entreprise Queen Bricks - 1 Allée du Plateau - 01800 Meximieux - France",
      50,
      720,
      { align: "center", width: 500 }
    )
    .text(
      "SIRET : 91157591800022   |   NAF : 4791B   |   RCS Bourg en Bresse 911 575 918",
      50,
      735,
      { align: "center", width: 500 }
    )
    .text("TVA Non applicable, art 293B du code général des impôts", 50, 750, {
      align: "center",
      width: 500,
    });

    
    function getHexColor(colorName) {
      return colorMap[colorName] || "#000000"; // Noir par défaut si inconnu
    }
    
  // Fin du document
  doc.end();

  res.json({
    message: "Facture générée",
    file: `/invoices/invoice_${req.params.orderId}.pdf`,
  });
});

// Route pour l'interface utilisateur
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(3000, () =>
  console.log("🚀 Serveur lancé sur http://localhost:3000")
);
