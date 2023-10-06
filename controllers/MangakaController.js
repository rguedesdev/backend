import { MangakaModel } from "../models/MangakaModel.js";
import { isValidObjectId } from "mongoose";
// Helpers
import getToken from "../helpers/get-token.js";
import getUserByToken from "../helpers/get-user-by-token.js";
class MangakaController {
    static async create(req, res) {
        const { mangakaName, information, twitter } = req.body;
        // Upload de Imagens
        let image = "";
        if (req.file) {
            if ("key" in req.file) {
                // Estamos usando o armazenamento S3
                if (typeof req.file.key === "string") {
                    image = req.file.key;
                }
            }
            else {
                // Estamos usando o armazenamento local
                if (typeof req.file.filename === "string") {
                    image = req.file.filename;
                }
            }
        }
        // Validações
        if (!mangakaName) {
            res.status(422).json({
                message: "O nome do Mangaka é o1brigatório!",
            });
            return;
        }
        const mangakaExist = await MangakaModel.findOne({
            mangakaName: mangakaName,
        });
        if (mangakaExist) {
            res.status(422).json({ message: "Mangaka já cadastrado!" });
            return;
        }
        if (!image) {
            res.status(422).json({ message: "A imagem é obrigatória!" });
            return;
        }
        // Pegar o Administrador responsável pelo cadastro do Hentai
        const token = getToken(req);
        const user = await getUserByToken(token);
        if (!user) {
            res.status(401).json({ message: "Usuário não encontrado!" });
            return;
        }
        // Criar uma nova Página de Hentai
        const mangaka = new MangakaModel({
            mangakaName: mangakaName,
            information: information,
            twitter: twitter,
            image,
        });
        try {
            const newMangaka = await mangaka.save();
            res.status(200).json({
                message: "Mangaka cadastrado com sucesso!",
                newMangaka,
            });
        }
        catch (err) {
            res.status(500).json({ message: err });
        }
    }
    static async getAllMangakas(req, res) {
        const mangakas = await MangakaModel.find().sort({ mangakaName: 1 });
        res.status(200).json({ mangakas });
    }
    static async getMangakaById(req, res) {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            res.status(422).json({ message: "ID inválido" });
        }
        const mangaka = await MangakaModel.findOne({ _id: id });
        if (!mangaka) {
            res.status(404).json({ message: "Mangaka não encontrado" });
        }
        res.status(200).json({ mangaka });
    }
}
export default MangakaController;
