import { TagsModel } from "../models/TagsModel.js";
// Helpers
import getToken from "../helpers/get-token.js";
import getUserByToken from "../helpers/get-user-by-token.js";
import { isValidObjectId } from "mongoose";
class TagsController {
    static async create(req, res) {
        const { tagName, definition } = req.body;
        // Upload de imagem
        let image = "";
        // Configuração do Req File para que o filename seja igual a key (Local e AWS S3)
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
        if (!tagName) {
            res.status(422).json({ message: "O nome da tag é obrigatório!" });
            return;
        }
        const tagExist = await TagsModel.findOne({ tagName: tagName });
        if (tagExist) {
            res.status(422).json({ message: "Tag já cadastradas!" });
            return;
        }
        if (!definition) {
            res.status(422).json({
                message: "A definição da tag é obrigatória!",
            });
            return;
        }
        // Pegar o Administrador responsável pelo cadastro da Tag
        const token = getToken(req);
        const user = await getUserByToken(token);
        if (!user) {
            res.status(401).json({ message: "Usuário não encontrado!" });
            return;
        }
        if (!image) {
            res.status(422).json({ message: "A imagem é obrigatória!" });
            return;
        }
        const tag = new TagsModel({
            tagName: tagName,
            definition: definition,
            image,
        });
        try {
            const newTag = await tag.save();
            res.status(200).json({
                message: "Tag cadastrada com sucesso",
                newTag,
            });
        }
        catch (err) {
            res.status(500).json({ message: err });
        }
    }
    static async getAllTags(req, res) {
        const tags = await TagsModel.find().sort({ tagName: 1 });
        res.status(200).json({ tags });
    }
    static async getTagById(req, res) {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            res.status(422).json({ message: "ID inválido!" });
            return;
        }
        // Verificar se a Tag existe
        const tag = await TagsModel.findOne({ _id: id });
        if (!tag) {
            res.status(404).json({ message: "Tag não encontrada" });
        }
        res.status(200).json({ tag });
    }
}
export default TagsController;
