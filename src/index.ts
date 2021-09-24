const path = require("path");
const fs = require("fs");
export enum EnvTypes {
    dotenv = 'dotenv', asm = 'asm'
}
interface Options {
    path: string;
    client?: any,
    secretName?: string
}
interface EnvObj {
    env: string;
    type: string;
}

export class AsmEnv {
    ENV: EnvObj;

    constructor(env: string, type: EnvTypes) {
        if (!EnvTypes[type] === undefined) throw new Error("Invalid Type")
        this.ENV = { env, type: EnvTypes[type] }
    }

    async load(options: Options) {
        if (this.ENV.type == EnvTypes.dotenv.toString()) {
            this.dotenvJSON(options)
        } else {
            if (options.client && options.secretName) {
                let { secret, decodedBinarySecret }: any = await this.getSecretValue(options.client, options.secretName)
                console.log({ secret, decodedBinarySecret })
                this.putEnv(secret)
            } else {
                console.error("ASM-ENV: client or secretName undefined")
            }
        }
    }

    private dotenvJSON(options: Options) {
        const jsonFile = (options && options.path) || ".env.json";

        let jsonString;
        try {
            jsonString = fs.readFileSync(path.resolve(process.cwd(), jsonFile), {
                encoding: "utf8"
            });
            this.putEnv(jsonString)
        } catch (err) {
            console.error("ASM-ENV: Error while reading env file")
        }       
    }
    private putEnv(jsonString: string) {
        try {
            const envConfig = JSON.parse(jsonString);

            for (const key in envConfig) {
                process.env[key] = process.env[key] || envConfig[key];
            }
        } catch (err) {
            console.error(err);
        }
    }

    private async getSecretValue(client: any, secretName: string) {
        let secret: any,
            decodedBinarySecret: any;
        return new Promise((resolve, reject) => {
            client.getSecretValue({ SecretId: secretName }, function (err: any, data: any) {
                if (err) {
                    console.log("AWS ERROR:" + err.code, err.message)
                    reject(err)
                }
                else {
                    // Decrypts secret using the associated KMS CMK.
                    // Depending on whether the secret is a string or binary, one of these fields will be populated.
                    if ('SecretString' in data) {
                        secret = data.SecretString;
                    } else {
                        let buff = Buffer.from(data.SecretBinary, 'base64');
                        decodedBinarySecret = buff.toString('ascii');
                    }
                }
                resolve({ secret, decodedBinarySecret })
            });
        })
    }

}


