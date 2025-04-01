import {
  RecordBatchReader,
  tableFromArrays,
  tableFromIPC,
  tableToIPC
} from 'apache-arrow';

/*
 * 1. Apache Arrowフォーマットのデータを作る
 */
const LENGTH = 2000;

// Apache Arrowは列指向なので列ごとにデータを作ります。
const keys = Array.from(
  { length: LENGTH },
  (_, i) => i);

const rainAmounts = Float32Array.from(
  { length: LENGTH },
  () => Number((Math.random() * 20).toFixed(1)));

const rainDates = Array.from(
  { length: LENGTH },
  (_, i) => new Date(Date.now() - 1000 * 60 * 60 * 24 * i));

const rainfall = tableFromArrays({
  _key: keys,
  precipitation: rainAmounts,
  date: rainDates
});

console.table([...rainfall]);

// この `buffer` がGroongaに送るデータです。
// GroongaへはApache Arrow IPC Streaming Format で送信する必要があります。
// https://groonga.org/ja/docs/reference/commands/load.html#values
const buffer = tableToIPC(rainfall, 'stream');
console.log(buffer);

/*
 * 2. GroongaにApache Arrowフォーマットでデータをロード > ロードする前の準備
 */
let response = null;

// ロード用のテーブルとカラムを作る
response = await fetch('http://localhost:10041/d/status');
console.log(await response.json());
response = await fetch('http://localhost:10041/d/table_create?name=Rainfall&key_type=UInt32');
console.log(await response.json());
response = await fetch('http://localhost:10041/d/column_create?table=Rainfall&name=precipitation&type=Float');
console.log(await response.json());
response = await fetch('http://localhost:10041/d/column_create?table=Rainfall&name=date&type=UInt64');
console.log(await response.json());

/*
 * 2. GroongaにApache Arrowフォーマットでデータをロード > ロードする
 */
response = await fetch(
  // `input_type=apache-arrow` を指定するとApache Arrowフォーマットで
  // ロードできます。
  'http://localhost:10041/d/load?table=Rainfall&input_type=apache-arrow',
  {
    method: 'POST',
    headers: {
      // Apache Arrowフォーマットを使う場合は次のContent-Typeを指定します。
      'Content-Type': 'application/x-apache-arrow-streaming'
    },
    // bodyに作ったデータを指定する
    body: buffer
  }
);
console.log(await response.json());

/*
 * 3. Groongaで検索してApache Arrowフォーマットでデータを得る
 */
// `output_type=apache-arrow` を指定するとApache Arrowフォーマットで
// 結果が得られる
response = await fetch('http://localhost:10041/d/select?table=Rainfall&output_type=apache-arrow');
// レスポンスにはHEADERと呼ばれるメタデータのテーブルと、
// BODYと呼ばれる結果のレコードのテーブルが含まれます。
// https://groonga.org/ja/docs/reference/command/output_format.html
for await (const reader of RecordBatchReader.readAll(await response.bytes())) {
  const table = tableFromIPC(reader);
  if (reader.schema.metadata.get('GROONGA:data_type') === 'metadata') {
    console.log('HEADER');
    console.log(table.toArray()[0]);
  } else {
    // Groongaのデフォルトでは10件のみ取得
    console.log('BODY');
    console.table(table.toArray());
  }
}
