# Local Danish punctuation

This extension redistributes the **syvai/danish-pnc** int8 model and its
tokenizer/configuration, unchanged, under **CC BY 4.0**.

- Source and author attribution: https://huggingface.co/syvai/danish-pnc
- Revision: `ac67b2ffcab409b069e759de8389e93ca25bdb14`
- License: `model/LICENSE`; https://creativecommons.org/licenses/by/4.0/
- Base model: https://huggingface.co/jonfd/electra-small-nordic
- Training sources identified by the model author: Danish Dynaword (CC0)
  and FineWeb 2 (ODC-By). See the source model card for provenance and limits.
- Integration changes: custom local WordPiece implementation, overlapping
  windows, preservation of original words/formatting, protected spans, end-of-
  paragraph punctuation, marginalizing case variants for punctuation decisions,
  supported clause-rule reinforcement, a bounded check for detached sentence
  fragments, shared context across soft line wraps and reviewable edits.
  The weights are unmodified.
- Model predictions are fallible; this integration is not a grammatical
  correctness guarantee and is not endorsed by the model's authors.

The WebAssembly inference runtime is **Microsoft ONNX Runtime Web 1.22.0**,
MIT licensed: https://github.com/microsoft/onnxruntime/tree/v1.22.0 .
Its license and third-party notices are in `ort/LICENSE` and
`ort/ThirdPartyNotices.txt`. Runtime files are copied without modification
from the published `onnxruntime-web@1.22.0` npm package.

`provenance.json` records SHA-256 checksums for the distributed assets.
The model files were verified against the publisher's pinned SHA256SUMS.
All JavaScript, WASM, model and tokenizer files are packaged locally; the
punctuation tool downloads no runtime code and sends no text to a service.
