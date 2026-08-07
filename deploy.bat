@echo off
echo [1] Limpando arquivos antigos...
if exist index.zip del index.zip

echo [2] Compactando projeto...
:: O parametro -a avisa para usar .zip baseado na extensao do arquivo final
tar.exe -a -c -f index.zip index.js package.json util constants

echo [3] Enviando para a AWS Lambda...
aws lambda update-function-code --function-name RTM_RichMsg --zip-file fileb://index.zip

echo [4] Limpando a sujeira...
if exist index.zip del index.zip

echo [5] Deploy concluido com sucesso!