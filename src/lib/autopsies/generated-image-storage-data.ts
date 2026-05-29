import type { AutopsyImageRole } from './types'

export interface GeneratedAutopsyImageStorageRecord {
  bucket: string
  storagePath: string
  storageVersion: string
  sha256: string
  publicUrl?: string
}

export type GeneratedAutopsyImageStorageData = Record<
  string,
  Partial<Record<AutopsyImageRole, GeneratedAutopsyImageStorageRecord>>
>

export const generatedAutopsyImageStorageData: GeneratedAutopsyImageStorageData = {
  "spotify-wrapped": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/spotify-wrapped/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "d969c9aea0440e89bbad76e9ed81b26e552ed5d7a4e081fa2d4f50b1da1fe612",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/spotify-wrapped/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/spotify-wrapped/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "7a18ab128405925cd5d0b0017b6f2fa2d0a82a0e487e09c7dc1d10c55105ba02",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/spotify-wrapped/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/spotify-wrapped/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "d4725680483d9ee8462742f8646ac12b8f0bbc081e54dcad932723930f24c83e",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/spotify-wrapped/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/spotify-wrapped/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "2cc9ce34858df21a120c6345285c83c1621da8aa0f7491f28b6004a733876507",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/spotify-wrapped/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/spotify-wrapped/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "ca9d604935eaa4fb259bcaea6b5a3a8bdca1eb321caec4cf14d5f804d13c974c",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/spotify-wrapped/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/spotify-wrapped/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "bc5beb96a61f292311faccafeb60adb13777f0ffa36e2806dc3937e8d0c66e2d",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/spotify-wrapped/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/spotify-wrapped/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "63c6e5098b23ec31d2741be86b454fb2a6275222239a0e0af91b22521d2b858d",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/spotify-wrapped/v1/social-cover.webp"
    }
  },
  "gmail-undo-send": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/gmail-undo-send/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "da30a99c22b95dfe45d1c4d2e192e441bd3d916b1cc1efb2dc9859bbbecabf58",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/gmail-undo-send/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/gmail-undo-send/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "4559e5a9c2529a05e6de8159c2bd57438390146230791e32dcba5169c7cb83dd",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/gmail-undo-send/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/gmail-undo-send/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "b40e215e16f383e12aa7d4ea6ee12459687d5d7eafa17ee136dc050662a1d8b5",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/gmail-undo-send/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/gmail-undo-send/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "0c36fb2dd11d32c1775bc60c0346606d2873c6a749dff0de921515671619ee8d",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/gmail-undo-send/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/gmail-undo-send/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "42fd5d1ce44eab6a3b56ca18deb1e6ffa3c5492aa3024defcd04469fa1652f61",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/gmail-undo-send/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/gmail-undo-send/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "1d6cecf105ce0e807d1590aa1146900414c2426fb31914a901e43d16a8f95633",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/gmail-undo-send/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/gmail-undo-send/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "6cca97ddfa3c45aac665e801930ec69a36268db6434501323a640cd4d24acf3b",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/gmail-undo-send/v1/social-cover.webp"
    }
  },
  "facebook-like-button": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/facebook-like-button/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "ec84ba27fb83401a58e11d103f187e49d62dd4c04ca273477bf152454bf0d537",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/facebook-like-button/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/facebook-like-button/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "33b0da0abd39eede5ddb1d2e37c5370d3b04b270944b5a84c9a0fdfb0ecb3ac9",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/facebook-like-button/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/facebook-like-button/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "edbe39f0347556e1c308722402fc7af71a7e46e24c84b23172845fc5cf754645",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/facebook-like-button/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/facebook-like-button/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "8b4960d70b49ea4ad24790e36ca40eee8e73b2f3487dae6779eb88174baa8f19",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/facebook-like-button/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/facebook-like-button/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "e47a2f7a283beb6c58194811bfb8ddebb54fbad0df8638bc6f1b0f46b5b1e205",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/facebook-like-button/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/facebook-like-button/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "b7c2c72a04429327811242a9de9697ae49cf960b1412b8d220aa36cdfa2251d3",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/facebook-like-button/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/facebook-like-button/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "9ff8bf7adc3b68636bc3177a6e5433624f1d5684afb757b2bd4749969dc86d9b",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/facebook-like-button/v1/social-cover.webp"
    }
  },
  "whatsapp-blue-ticks": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/whatsapp-blue-ticks/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "ff67f39358b694eb54bd9c8c91835d0612aa4db713d8e3528ae244b64bba2593",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/whatsapp-blue-ticks/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/whatsapp-blue-ticks/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "f78911f5e8264ca091795f14f50f797f762380f3aff286d897e748dfb402ed62",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/whatsapp-blue-ticks/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/whatsapp-blue-ticks/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "9b3b52a087b489254a9d3fe2fe9567b055b34f34a20c0958732e6f0e3a997f55",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/whatsapp-blue-ticks/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/whatsapp-blue-ticks/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "e0e84f88681dc26a9f476127fd737c761a8bd3099039515fe41cde4f1b334e47",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/whatsapp-blue-ticks/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/whatsapp-blue-ticks/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "01aea3b812decc6191bedc576b5f6545417970cd385d22927968eb18b783e1af",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/whatsapp-blue-ticks/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/whatsapp-blue-ticks/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "ef2956f199f8d7335393734c62124f883cbc41cc7bc47712bacb80c1d1cec504",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/whatsapp-blue-ticks/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/whatsapp-blue-ticks/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "bbd4db85c55c9e3f6f72734439c70d0224b145b3e5acadfe3307dac12e8b046f",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/whatsapp-blue-ticks/v1/social-cover.webp"
    }
  },
  "whatsapp-groups": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/whatsapp-groups/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "e9d494847a06ecc5e8fc26cc6ecaa032d385ca5618c9dfeee314d633bfde3b5d",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/whatsapp-groups/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/whatsapp-groups/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "92704b0d6c836fad0c722892733ba46ad153c73fa9484159bb94c59dcad7c98f",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/whatsapp-groups/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/whatsapp-groups/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "fc2fdf91c7bda0d53df54a8da2e15ec1c4242e6fdd42cb9ca871423edaf0a236",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/whatsapp-groups/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/whatsapp-groups/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "98a0329c9c897bf6f4aac7b22f0c2406ed18d0e33afbd020feeca425f0764462",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/whatsapp-groups/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/whatsapp-groups/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "32f2f45e36eb8501e96530618e4b3ec5510177bcb19cda13028963e2efc99ad4",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/whatsapp-groups/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/whatsapp-groups/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "13db7aa052151b559ddd79a9ea12fcbfbb8fde89ec03c7f66cc3021ab044a9d3",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/whatsapp-groups/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/whatsapp-groups/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "b341157627edcb0204bcb083a0ae8a8ec51b2982c059548fa31faf237af3d63e",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/whatsapp-groups/v1/social-cover.webp"
    }
  },
  "instagram-filters": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/instagram-filters/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "3feef9552d84073dbc5f54c811c83c8e96ec5e5df6228f129a2c9f10ad25836d",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/instagram-filters/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/instagram-filters/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "037ecbca1cc4c25c60aad9d46c8f4600cb97b7daa28d45aee78520cbd7ee679e",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/instagram-filters/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/instagram-filters/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "710a59def25bdf6955e8bd5134689e446c6ec981c68d251529c75fbbcbc8e571",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/instagram-filters/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/instagram-filters/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "27c3cf50dcfdfa79593bfa10b0b355fec10d78fd9682769a7e4082ee9fe1e676",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/instagram-filters/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/instagram-filters/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "ccd91dc09c20b20a707917e3ffda2247923b3d6623fd38b443f7a3f5b7a61c25",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/instagram-filters/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/instagram-filters/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "3bc638de7ae2bac120ca57b2a64e94107ce4c43293cf5e2704699786ce560a87",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/instagram-filters/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/instagram-filters/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "d0839e8f895138c451aa043f5797553667ccd6933ce35d89efa326180ec1b741",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/instagram-filters/v1/social-cover.webp"
    }
  },
  "wordle": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/wordle/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "edadbd3f169a0b0b8fe7d7176904c5b47f5d79b59e3dd3ceca127c3dda094da6",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/wordle/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/wordle/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "10a029ce56a095ab746b638758786e66a6772630961ae0c6b8fb359719b6689f",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/wordle/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/wordle/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "f613f54da6caa1ac2d53b755bd5e043fd410fede95ccbbfe2aac5a678dae5182",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/wordle/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/wordle/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "25721bb3c2e46d1e81bd619ea03bb6f163d5218e677faac68377543489ffd5ba",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/wordle/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/wordle/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "1f027f6cfbdae5679644b2398cd9b6ea46ae3576cc011551c4f5fe4f00a60e3d",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/wordle/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/wordle/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "8df02fa308a43200450ce74fafcd58afc4867717a695c629a57a1c15ba54e73b",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/wordle/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/wordle/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "51723653966dc0eeede164856fdacc6c34216cb5edf4a52d1fd3f8dac362f8e3",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/wordle/v1/social-cover.webp"
    }
  },
  "dropbox-referral": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/dropbox-referral/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "77c83796d753c27752cae44b280b236e0d80158d255a40c88b0dbc734aafde54",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/dropbox-referral/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/dropbox-referral/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "3b8ba30285c02eb8d24d2064e58a62d3c4f75aea97cb1ef88e7ed5e392bfb55c",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/dropbox-referral/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/dropbox-referral/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "2af58101081abcde881ff1511b76c2ed488076b0bfda6d545fa69b98154abd62",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/dropbox-referral/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/dropbox-referral/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "e29c3a9aebcb6b6088db862358322f5de39f0abccd5c1f7f6fd8ab88c4c80c89",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/dropbox-referral/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/dropbox-referral/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "6eee0bce9644440ae18edc2219ec0c44e9a21d67a8d4534867977e5545d2f8ff",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/dropbox-referral/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/dropbox-referral/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "3db28f7d21e5bc9b2545ae9f949d87be89e6085f0f264f8c9720ce5edf98e74a",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/dropbox-referral/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/dropbox-referral/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "6e7f6ee7b4b420bd0d073b9baffcca95068b5e26dcc2a03056648d221fc14d8e",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/dropbox-referral/v1/social-cover.webp"
    }
  },
  "twitter-hashtag": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/twitter-hashtag/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "180c28639ac7e7cd0f57f8c5dbbf9999c322d4419312f3325af1b4517e3377a9",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/twitter-hashtag/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/twitter-hashtag/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "78d1742e7d6a9ca071a66e0cff9f6d214b1d090d650810e5bbd41a754dc4bd71",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/twitter-hashtag/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/twitter-hashtag/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "8edd2fdeecb775fc2a313d15fe2f7f1eea22ed167403c5f2550333577516bb0b",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/twitter-hashtag/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/twitter-hashtag/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "0de28505ef978697305bd671be4c9a1c15019db742b40117f83cfaf347c69c1f",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/twitter-hashtag/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/twitter-hashtag/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "4887908e86da9d47445c617b385afe81dba7e9571d18ad4c62da91506d54ec85",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/twitter-hashtag/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/twitter-hashtag/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "6e95935a9c974187cd2e50918aa98172191dc2d11d3af7f14226dfd14bce563c",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/twitter-hashtag/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/twitter-hashtag/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "a7e61b8c882e202a671aad99bf62a4db0362d5de2df4b9b50cb451f59def3e47",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/twitter-hashtag/v1/social-cover.webp"
    }
  },
  "duolingo-streak": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/duolingo-streak/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "de0830f5511a9dace4b94bbea31ff763b9ce4aab8fb79af022ee8829913b7368",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/duolingo-streak/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/duolingo-streak/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "90db360a239a147fa32209c123d3787ebbab41f8b8b7c21e06ed3690f8423b95",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/duolingo-streak/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/duolingo-streak/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "94ff92efbcfe607282672b2b194de266169163d1ad3411f7b674633fbb573fab",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/duolingo-streak/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/duolingo-streak/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "654f10d88d41e71848783db6a0b3a7c995dea7baaf186c608edcff23f084c4c5",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/duolingo-streak/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/duolingo-streak/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "b48c97ad5e70e182bb8b65e16b592109efc510264a0b463d9e7fe4c0b0dcb46e",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/duolingo-streak/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/duolingo-streak/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "841c211c551969910b6b6c19586f5bfa4402f685a0ce694355666dcf2885325a",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/duolingo-streak/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/duolingo-streak/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "9322affe5652c0f9f44831e7e449e01e15b6765dfa7d5f58a4fc804a5a335383",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/duolingo-streak/v1/social-cover.webp"
    }
  },
  "tinder-swipe": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/tinder-swipe/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "2f844c2cd7ce9a488657ebd073a84a5d4e8e3aa8c5d01e78d9707c05ebc33a2c",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/tinder-swipe/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/tinder-swipe/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "8b224d0f53b7f099e3a0c7444e475c3302213883922f906b4b7305112a56aa0d",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/tinder-swipe/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/tinder-swipe/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "d1c190e2a7561efcd8c1bf2777d03f717127dae9c70e4ce71663326db778d7b7",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/tinder-swipe/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/tinder-swipe/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "c391d8094273eac9630caf5a5c792e87da3f53cee145cec85cecaa6677c44919",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/tinder-swipe/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/tinder-swipe/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "ebaa635c216331b443fdca9fbfb1ef6bd45c0d6195619e9ee679e1ada951bf23",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/tinder-swipe/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/tinder-swipe/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "d349eb2af8d007fdc514f2058b501d43a017c24364a0cfd449dc5e63a02ef1ae",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/tinder-swipe/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/tinder-swipe/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "fda5baed17eba3e24b3b0d6466b2156c33ba6017a41ee8ef187fe95148918f9e",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/tinder-swipe/v1/social-cover.webp"
    }
  },
  "stripe-seven-line-integration": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/stripe-seven-line-integration/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "db119e431834fb9f4638954258574e0ccd14eff06ff4f77a56a62f515ccdf840",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/stripe-seven-line-integration/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/stripe-seven-line-integration/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "42001570ddc3ca627e97c203a80be411b959ac7b3e948bd5479405291986a228",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/stripe-seven-line-integration/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/stripe-seven-line-integration/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "c1444289ec9502941188b78a2b378007bdc72b629eff40d5e400450a28b2f9a6",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/stripe-seven-line-integration/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/stripe-seven-line-integration/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "8a8c2e1c71d31ce547c96b5273fbf45892daa2fcec0fd31ddcde8204cca7ff2f",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/stripe-seven-line-integration/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/stripe-seven-line-integration/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "9bdb26e56772344b0eed77ee742b567e3d79f9a531ddc4634d7292e232b139b8",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/stripe-seven-line-integration/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/stripe-seven-line-integration/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "d6e9b4862d968a696604acf2d5bc2647920ce05219969959aad904283ef3d7e8",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/stripe-seven-line-integration/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/stripe-seven-line-integration/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "9736108ad0dc65aa466cfd93e75a78b94c2ad9b467a32e9ef73cece3b56f3955",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/stripe-seven-line-integration/v1/social-cover.webp"
    }
  },
  "airbnb-craigslist-hack": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/airbnb-craigslist-hack/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "6980d965afa9a908dcf11322e89100148be66ce7a49ce6ffa25e912e5ef746ce",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/airbnb-craigslist-hack/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/airbnb-craigslist-hack/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "9622626505f80b54cc991f533ca81d7b30515a93e733488c227973c2d8b388dc",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/airbnb-craigslist-hack/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/airbnb-craigslist-hack/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "e104a4396f291bc184d25dea3653e3ca753fe95fdf9e1eeb3fde2674c5b53732",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/airbnb-craigslist-hack/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/airbnb-craigslist-hack/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "aa965d7c859428acc876ed7a5d9977043453913145a3bd1901f65cf443d86162",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/airbnb-craigslist-hack/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/airbnb-craigslist-hack/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "540d91457f20f94de6c76a58ff3604529b488cea008d184f23dcfca05a9b7851",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/airbnb-craigslist-hack/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/airbnb-craigslist-hack/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "49a612e8d5f0edaba1155d104ecc6b25db90f6d57d0da0eb7784e27b1063b448",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/airbnb-craigslist-hack/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/airbnb-craigslist-hack/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "c9671b8c4f581ec85aa867cd512260dd6cfe4ca660c1b42759fd54c3575cfb48",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/airbnb-craigslist-hack/v1/social-cover.webp"
    }
  },
  "notion-slash-command": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/notion-slash-command/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "fbb964b26bc9c6e6dd47087b96cedab336dc5be4acd7ff51268bf42408dd84af",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/notion-slash-command/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/notion-slash-command/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "ab6e419bef49aa249dd1b8c74875f613555d33edb88ffa7d6a6a64e914dbe327",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/notion-slash-command/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/notion-slash-command/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "e6ac82250b8db497fedef5329e85b679c7003b5018cd1da42a74436a9902c617",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/notion-slash-command/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/notion-slash-command/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "8de1f472a2ed3b86863936155dde8f5bbebdd05ad7f682cb8e3078c3f8561dc7",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/notion-slash-command/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/notion-slash-command/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "40ccc33351055cbec351f774a4a0e55ca938adca1b88757796fac086f6d5cd7c",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/notion-slash-command/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/notion-slash-command/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "9058b4c2bf9a92739c7d681b5ab9b85812a15df84482fe4840caa369b56fa7cd",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/notion-slash-command/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/notion-slash-command/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "898d75524560c7a393b0d348748fec05fdd869fe6aaab723fbcbe549cba2ed6a",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/notion-slash-command/v1/social-cover.webp"
    }
  },
  "calendly-scheduling-link": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/calendly-scheduling-link/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "c64d891fffb52202d3156bdc36a7cef3f4e2b35651627ebdf5569bfaaf8f100b",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/calendly-scheduling-link/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/calendly-scheduling-link/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "5a823ffa0517896e48b7e25c188aaa055361843335d468b5f5651c9bd9341cd3",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/calendly-scheduling-link/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/calendly-scheduling-link/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "0e1f341a80e1f91c9dafb7b158ab9fe605662a0e002b4d088c4d393517a08f2e",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/calendly-scheduling-link/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/calendly-scheduling-link/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "c50a8f93b2d5697019c0648c23ff83751312269d76fdba4a741d6940191a5f0e",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/calendly-scheduling-link/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/calendly-scheduling-link/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "afd76dc38c8fa795a1a1ef224fa84064827169068b9d9ec48cf7584248eff855",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/calendly-scheduling-link/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/calendly-scheduling-link/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "151be83c70ec59bfaff54a8c732a45c23ce04080bdfb5e900073568b58fb6ae7",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/calendly-scheduling-link/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/calendly-scheduling-link/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "4c3dd29e229b2204af526c425a9b66d2b80f3d5870e5dc5f9cba2cc996247daf",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/calendly-scheduling-link/v1/social-cover.webp"
    }
  },
  "linkedin-pymk": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/linkedin-pymk/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "2fe390d37361aeddbc529e774ca0fbf74f091c73bd4d422c4ea31826c953b49a",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/linkedin-pymk/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/linkedin-pymk/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "88e7d0ab225f1e70712d38f0e9e6550a191ea42b293dc5e161e80f3c90f0b25b",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/linkedin-pymk/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/linkedin-pymk/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "41ad2a51657e203e82a0469557891f4a7704ea71ebad3b48708c1c5303330ff1",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/linkedin-pymk/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/linkedin-pymk/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "be341e3b43c3f0ac060e407b9ed923569f0aec54cbfcaecf593da7ce4b1719ff",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/linkedin-pymk/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/linkedin-pymk/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "29d5735c8eb40cd085a4ec3121a40fd84b97806988631aebe8f2e9d15a82104b",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/linkedin-pymk/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/linkedin-pymk/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "f15fa370c89b057f95f4eb6758ac9b1943c8b122e581f992b71069cb19d4d91b",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/linkedin-pymk/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/linkedin-pymk/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "4c61110e314eb8e0911d3db648b88d1b0db57cffaf2390e136c0e8006aac37af",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/linkedin-pymk/v1/social-cover.webp"
    }
  },
  "youtube-autoplay": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/youtube-autoplay/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "73461bf788e7e15316bc5ecf19259989bf23e655d702e1e268d2b7f67010ecdd",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/youtube-autoplay/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/youtube-autoplay/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "215e4d1d23efde1c6ee2ab653be2b0e35c7fb3768e1b75a16b06d1dba6d41a69",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/youtube-autoplay/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/youtube-autoplay/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "a88c67a746e911f2a259c5d6cefba985f47207a3168979c3be60e1305081b71a",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/youtube-autoplay/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/youtube-autoplay/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "e1a05aebff9e4f376c9137e2742027039cfc4b59361130e14cd1aeb9d89a11a8",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/youtube-autoplay/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/youtube-autoplay/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "0c9640df09bbdd051a1175f0b8faa4e924d45a8daccaccfc59098a1b5983d486",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/youtube-autoplay/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/youtube-autoplay/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "c1c0b2881639d6eec4cd59638763cc4f8e3369cd795ac5c68c4962204787d9f2",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/youtube-autoplay/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/youtube-autoplay/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "d2f007abe18437515ddcece45dda5f33775b5d994e75762241a33dd1cee28fed",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/youtube-autoplay/v1/social-cover.webp"
    }
  },
  "figma-multiplayer": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/figma-multiplayer/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "074856e46809e09473c25e02da23da580615f2c72b80c21b7e7622c9a67840f6",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/figma-multiplayer/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/figma-multiplayer/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "05dc46104d924a9f102ab0647a398cb5bf65e414ac8d2a0ad37d86849fed6dff",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/figma-multiplayer/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/figma-multiplayer/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "c98cfb8f4d39654d75f6342bd28c50c0e57da1dfa1613a8ac199116aa8f11e98",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/figma-multiplayer/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/figma-multiplayer/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "c6ebf6ba8528e1054249d5d83572fb0f6a314b1925104b4e6b9e029642960782",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/figma-multiplayer/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/figma-multiplayer/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "7f2dab88c9e0f33917940daa806e38ecb4a7647b901baf6283dbed1667b68c43",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/figma-multiplayer/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/figma-multiplayer/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "4a13f96dff7b9e0beb81016755047bbbf7041f0fdffd3b66ef6ae56f5a94314c",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/figma-multiplayer/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/figma-multiplayer/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "26fe3164db2459730cf7254f8812e58f1dc495c4151d37cc14c5e324d68d3900",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/figma-multiplayer/v1/social-cover.webp"
    }
  },
  "slack-emoji-reactions": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/slack-emoji-reactions/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "c5d586b33bbd2b0abbcbfacbe378cd6c2fc34e475805a7f264cee9771b84d2eb",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/slack-emoji-reactions/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/slack-emoji-reactions/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "2da70cc6628d6b5bc01f04273542147a73e603a4634802c74255e13ecbbe37ea",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/slack-emoji-reactions/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/slack-emoji-reactions/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "e411974578647678d55700eb3d0e2a9bc07b9114d2bc1afea1cf9e373c1a129e",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/slack-emoji-reactions/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/slack-emoji-reactions/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "d19efcd2d95a02c840beb5bd9d0ecfb075499bd1f2210212c80d45005a5c5949",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/slack-emoji-reactions/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/slack-emoji-reactions/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "db8f86f73e3a33c37cba485b9929c1ba6880b1158d933d9fa33b84cf842de14d",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/slack-emoji-reactions/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/slack-emoji-reactions/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "fcd67b8f171195218003c428567024960b76d2d6baea92ef92fabcb605a6f5f4",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/slack-emoji-reactions/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/slack-emoji-reactions/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "6870d26af0d7d368356bbc75214cbbef2b8069ef1ebccf3998953b5bad422d3e",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/slack-emoji-reactions/v1/social-cover.webp"
    }
  },
  "facebook-birthday-reminders": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/facebook-birthday-reminders/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "0a3aaf8ad6c5f823b67b9e17cee85bb79a68660bb5e886f26de401e2edc19b6f",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/facebook-birthday-reminders/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/facebook-birthday-reminders/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "26c313777f2af8e8a61070f793e90af9157eb4f6efcecf7b593b3e5e5c1bd8aa",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/facebook-birthday-reminders/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/facebook-birthday-reminders/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "5396c468264c69653fa8ff2e42ece1b626c9f8090492341cf416a9cbf1472665",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/facebook-birthday-reminders/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/facebook-birthday-reminders/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "562e0223effc8e619ac88c5bda593c94eccd545061a3c184980b5bb609f35264",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/facebook-birthday-reminders/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/facebook-birthday-reminders/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "63de185481d36638c0c626f33e5f0024bbbd82ae916f493035a7cc0bda8b028e",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/facebook-birthday-reminders/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/facebook-birthday-reminders/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "40ce2563d80fc4c47b513dc05441041582f33eff776726e730a7e629c5c9a821",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/facebook-birthday-reminders/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/facebook-birthday-reminders/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "85c941c0766347cb29618dbf752403bba639f95da39556d84086ac4a3cfe549c",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/facebook-birthday-reminders/v1/social-cover.webp"
    }
  },
  "netflix-still-watching": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/netflix-still-watching/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "11b1802f5bec3f6651d63e212dc83ffa0ea0c797ec2ac0d143067c3319721821",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/netflix-still-watching/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/netflix-still-watching/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "9f7c933dcfc44dee9e2d9f19345058e6f6250a0bc06ffb9f914cf6408d1af966",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/netflix-still-watching/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/netflix-still-watching/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "c739287a5675f5365b4262db0adc525254076beed2c92c4defd5c95d245ba4f6",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/netflix-still-watching/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/netflix-still-watching/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "9ee748f55764639012cc598ef6e3c9082fc845491c82aea4eb4caec5232284cc",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/netflix-still-watching/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/netflix-still-watching/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "959a3035c5cf209eec36e27184e23e96ffe0d5eee4d8735344298d895d895401",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/netflix-still-watching/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/netflix-still-watching/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "7d352bd18859eab3d26bc2b57dae67e166f285185e7ff86567e14e982efe78ff",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/netflix-still-watching/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/netflix-still-watching/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "bdf3af65b59e487261b63abcb90b615ee6d3ba84770effb3a0e63dd7c69da17d",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/netflix-still-watching/v1/social-cover.webp"
    }
  },
  "google-did-you-mean": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/google-did-you-mean/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "1b75f2fb42ee3c60fc39b63af48366f4286d0340b09e47ef6367690ded553271",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/google-did-you-mean/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/google-did-you-mean/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "efc59c33e66bf3030dd59f8454753b363d484cc06ce71a1745ed8787ceb05cb5",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/google-did-you-mean/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/google-did-you-mean/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "140bd09930610f5c19bf32594676486c262863e350b90fb763b816aaced170ea",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/google-did-you-mean/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/google-did-you-mean/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "7dd5e9e32fdc7dda319184d05a87fc78ea45ddf55a18160cac7c46fb55fa5e36",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/google-did-you-mean/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/google-did-you-mean/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "e929f37b66339b3ca3c4c12f7171f2a412491258f59d7924928f33b21abb4bb4",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/google-did-you-mean/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/google-did-you-mean/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "4a618485fa3da56ab3bc16f42cc5d8852f219b0ff06b5eb3eb4f20cda3fbfe4c",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/google-did-you-mean/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/google-did-you-mean/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "fb24a7ad5f2f1b5048e9507344c98a85f408510c74d215fe47dc318b1ce8754d",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/google-did-you-mean/v1/social-cover.webp"
    }
  },
  "dark-sky": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/dark-sky/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "1ff6904a9fd95dce85be58f3695b90f0b2fe9b81fecf136ce875b76172dc2415",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/dark-sky/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/dark-sky/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "6dde699647f596ae546712fb2a2a8da618af8f7f1b77d2cdfed3684bfc5534b8",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/dark-sky/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/dark-sky/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "d266202fcf677c87775ac1d84a5d7bf5043451b51acb4a4f56e8debc75c6ada7",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/dark-sky/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/dark-sky/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "9d6f820d963960ca5811a05341ff724e5e278a9ee096b7bfcc2d10f89ccd26e4",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/dark-sky/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/dark-sky/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "0061dbd9999e080bdcd7ba4c5afa70bea9a255d5c9c2dbc12dd0a18a6357e488",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/dark-sky/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/dark-sky/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "4d81b269dc8b2d42068e30dd26c0106173fd16adf4e10e0a92239ca8eac9bc6d",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/dark-sky/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/dark-sky/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "cab375db04fc5805e218099ff57fcf8ea9c11a99e659ef9ca70310753c1b790f",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/dark-sky/v1/social-cover.webp"
    }
  },
  "flux": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/flux/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "7644bb51bcc62a8e058594912c8694a488fc2e6db98cdb7ce9e2f5c5ff073fd0",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/flux/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/flux/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "e944cbd5c0b3711dc682245a43ef4d291ca8152388446796a4a30d6f1404cd2a",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/flux/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/flux/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "69b89da842d9e2f65c250097f6f2820d9184de7289f8f31c3c6e63cffc114fd6",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/flux/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/flux/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "e80c1741ddfbd96b17fca8e5b77a1f2f149adecdde3b7afd81c40494df8345ed",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/flux/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/flux/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "c79eecb0c65b58484ca2ace89b839e24007df591931cd9a73db0984054a4ebf8",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/flux/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/flux/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "a443c92178e33798b0ef487cd1f5669809489068e76ec2b922d10e84020d0ca5",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/flux/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/flux/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "772a69d1a205c8237b085018d779097ab58a34a5d1fe29c7ecce0bbbca3eed4c",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/flux/v1/social-cover.webp"
    }
  },
  "honey": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/honey/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "f4011c6a538eac0218911e76f379b43c52ac7388aea60443b6183060aa28a046",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/honey/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/honey/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "07b835c93ed3962c2e5930496ff9818722c8f4153d341ee5369d260ba206a092",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/honey/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/honey/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "cc63f03a5a00cf47c50ab7930a6269147c8630b1900de2c9e5a7f876d2f709ac",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/honey/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/honey/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "140563839cccde7544c6c5b7fcb570c8f447f4bddc42ee3d40ac4260469397fc",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/honey/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/honey/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "88178b4df158a8d351f591b771b331f441663167701a815b6f5b70899a1bdd1f",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/honey/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/honey/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "2a371d4f778d84daae8c58663b0959d62996b177347037950b8aed7e4be18737",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/honey/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/honey/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "f809fe818cbf02165985ef4ebcaadcd541b52a48ec4fb383999743fa160bf9bc",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/honey/v1/social-cover.webp"
    }
  },
  "unsplash": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/unsplash/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "4b4dfed741d4ae506768377431289ab61429d0029d8f1abc396736c20307ace5",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/unsplash/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/unsplash/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "18daedf5b35e79c0a0450989298b5f768f2b82c4e675d5ef7705f5a07590989e",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/unsplash/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/unsplash/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "d6da5a8600a99b6e9d807cddd6611b24024d22de236525db19e74705efbfca19",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/unsplash/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/unsplash/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "6f43a65999720f608c2c46beb66950070cca67ab7f2f64ef7b6ae2f48afb60e6",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/unsplash/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/unsplash/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "5b62364d2422d9ed72ec4cf80e0ea2c3bd0b10fb6bbea7c8ad18a1750d7124a4",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/unsplash/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/unsplash/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "0be5b76fe0e56b654fe2afef3bf3541530be68417e279a5262f2036d211bcaf7",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/unsplash/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/unsplash/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "2b928486143832967f9c055ededdbb3b94721421fcb2b0bdc25c522f0d37402a",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/unsplash/v1/social-cover.webp"
    }
  },
  "product-hunt": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/product-hunt/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "f07e11472f4313eec66ce68623cc3e58c8c8a4cc47c8ae553d0b71f3d7fb9b83",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/product-hunt/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/product-hunt/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "7844cbd63da2cd031f8e2938aea1734df39e35b800a75edbc2e5430096b45877",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/product-hunt/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/product-hunt/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "0d19d618679bf91a7c3205fdfc0be74f06d9504484d0311ceba00560774aaaed",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/product-hunt/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/product-hunt/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "76765f73b90c45339efc8085c8bc7b78450ee028cde2fb9a3d42427146552700",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/product-hunt/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/product-hunt/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "a80b4e320ce06abe9640c2a4d26d7f4eab6d2291db1fffb3ad16a96cb560cb12",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/product-hunt/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/product-hunt/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "fe978315b3a7922fe9aca41c969060e9d4c7096ef6f590741a77adaa47ef14f6",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/product-hunt/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/product-hunt/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "477316a7a56284f5b1a9878c247b67591d23b18c86be489b6eaa0e8f2c985fcb",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/product-hunt/v1/social-cover.webp"
    }
  },
  "nomad-list": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/nomad-list/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "f296017b596586fa0acdd0df957755f504c7b234f371a100b3fc412185c7ec6c",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/nomad-list/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/nomad-list/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "806234299d3acd2d6ef860e74eb3fca0b5922fb12529a5f2d981df2da994e295",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/nomad-list/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/nomad-list/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "38b30040199f0a559c1fe4019d87ad4fadf42b0541509ca37b9bccc0bef62271",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/nomad-list/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/nomad-list/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "29b04736f1eee732036d5b90edea62385813ec44836eb10295c4465fe301140d",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/nomad-list/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/nomad-list/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "422162c6495a30068f74c7d8d15c7106119662caba2bb7509f7ab812711563c2",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/nomad-list/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/nomad-list/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "e170f010b3235d0286763553d04bb800656f517734d40c2e83847f016ea4405a",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/nomad-list/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/nomad-list/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "583e72f6bb7c3257c673d5f48a2628cf7bfa6fd2f16c3df7587231001728deda",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/nomad-list/v1/social-cover.webp"
    }
  },
  "gumroad": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/gumroad/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "5bcc7ca4c088b662176907f56498f9bdd5eb0c1bf852c479f486992c4e0250fa",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/gumroad/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/gumroad/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "ac5ae3441ecaa1465048b54785b362450db64c6e4f9c92b4aace08870975eef3",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/gumroad/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/gumroad/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "8375d3aa6faf7f0aefcc163c9a17f671ebf32af3ae9785169554c56127b1c2a2",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/gumroad/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/gumroad/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "430bfbc3b56214c679c6c33fdd72aeb06be6d2d30f2ef2a96441f0e19619314e",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/gumroad/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/gumroad/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "3316511457a765eebe6b1878e51b2a4604a1514135ba29121d3e83f8b6bb2943",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/gumroad/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/gumroad/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "341846bf4f6a9a0e2f133c652f2638b0eb6b0b5fa22d66c4d1292265a2565c72",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/gumroad/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/gumroad/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "b9ea0278de2350d24fa1c141c765967c1adb3972cfc3751af7e00c49d52aaddd",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/gumroad/v1/social-cover.webp"
    }
  },
  "buffer-fake-landing-page-mvp": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/buffer-fake-landing-page-mvp/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "fd9f37a09e0817713e819807ad549521af7f13eac71ef085d66a400092fb1a04",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/buffer-fake-landing-page-mvp/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/buffer-fake-landing-page-mvp/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "be0acd4568cfdefc8b04f20efef33a9b9bc08bac5a786d3c73e8e30efcd2c7ab",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/buffer-fake-landing-page-mvp/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/buffer-fake-landing-page-mvp/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "8a626559fa2f1e7b46b62f1231bfcbfc862004d72dcd7431d4871d777b7b4ca4",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/buffer-fake-landing-page-mvp/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/buffer-fake-landing-page-mvp/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "3baaff1f5dbe674e1b38dac94aa0e5f8637b950bf22c6416d496db39d17ea25e",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/buffer-fake-landing-page-mvp/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/buffer-fake-landing-page-mvp/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "4d157e6d542250fcb2bc4fb2c8ecca912b7f8c1dacf4d4cb54ff8a9604015e07",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/buffer-fake-landing-page-mvp/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/buffer-fake-landing-page-mvp/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "98a349c74e392ed89d9f413fdba4d74140d5b7e2e7200431075ceda123e23f2b",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/buffer-fake-landing-page-mvp/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/buffer-fake-landing-page-mvp/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "288f0a0c7b39c2b2ea2af0df39e080d5d525d49ba6e61ed957e29d354d0e8ed4",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/buffer-fake-landing-page-mvp/v1/social-cover.webp"
    }
  },
  "hotmail-ps-i-love-you": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/hotmail-ps-i-love-you/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "744139979b367cb0d115c7902728a48cc74ccc71b3b15a36664d27a85138c8f6",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/hotmail-ps-i-love-you/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/hotmail-ps-i-love-you/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "0d1f83b7f5529d9df1198bc99635b9c84aaf1f9a60ad53f0d374bcc9acafa237",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/hotmail-ps-i-love-you/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/hotmail-ps-i-love-you/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "a0d7a73b240c6135bc03f2f7e42b301ba397894c1aeeb7fd879c1e253fad2a56",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/hotmail-ps-i-love-you/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/hotmail-ps-i-love-you/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "aa9b51a34ff9880311343970682d00e22aba7a246cc205c64229eb185a02538e",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/hotmail-ps-i-love-you/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/hotmail-ps-i-love-you/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "d7fbf62237bcc7ca71f5ac01fb7edbdd6a69d05db38ef19262e7d47e0857940e",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/hotmail-ps-i-love-you/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/hotmail-ps-i-love-you/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "10d4a91a2166982c8cdbd5132c6469fd6d0d77589bbf43425aca1cc9a1b24717",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/hotmail-ps-i-love-you/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/hotmail-ps-i-love-you/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "aa2faf1ecf1c6b4d184376c9e945fdb38e8ad66a9fe804eac8c4b7ad0df95a16",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/hotmail-ps-i-love-you/v1/social-cover.webp"
    }
  },
  "robinhood-waitlist": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/robinhood-waitlist/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "8ad82ef701fd326915853080f11e929e8b7fc0a6d9f355e11de74ad2fc73e991",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/robinhood-waitlist/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/robinhood-waitlist/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "15a5b6248814591b4678df5b75751fd0cb88be2fad1be7a19f052058f9ac9077",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/robinhood-waitlist/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/robinhood-waitlist/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "46dea71d1fc0c826fcad490285a2bae92a544387ffbdfc8a2c511153b11c745b",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/robinhood-waitlist/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/robinhood-waitlist/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "fb4d7da71f6abe840fc5deb526be3cc97227eda93799951f4c104dbf15be5b6c",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/robinhood-waitlist/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/robinhood-waitlist/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "82c9674e1cf5d71fe4a295fc6b4a2838d72d6dd458d40e8f22032dbcd563f250",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/robinhood-waitlist/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/robinhood-waitlist/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "300ed6338641191cbf066f01f280beb4bff71d51ed0c7dace7745ce7c8ab8b57",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/robinhood-waitlist/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/robinhood-waitlist/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "e32c74c0d1d782492d3eac2989613d2a18bcc322796ed86406847ad6f9531cb1",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/robinhood-waitlist/v1/social-cover.webp"
    }
  },
  "typeform": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/typeform/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "7d49d3500bb1c0d6e0939f578511019fd04d2b2d2fd379f236b3b98302e9a462",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/typeform/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/typeform/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "f984e7f08d935ab0391a61530b6dad20e0363032f2da9c8ee301ed2305d5fd26",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/typeform/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/typeform/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "6050b144105f551d67a063ce89fa56813a981e7b25bb408077be256430ada19e",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/typeform/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/typeform/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "87271ebc0238e051f48e37d14b73f33f7c4b480cfb2cff58cfb3e772993406bc",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/typeform/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/typeform/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "46c8389eff8edd97ac249b69ab51c8c45260ee6c32e622425fbee6055db8ae19",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/typeform/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/typeform/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "b5be221bcf5fd62d8bade8dcf3d9a2e9edac291d06444e249d59569bee9aa65c",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/typeform/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/typeform/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "f41314ac80a87ab7d8ee59e7f7d4c2a5e8fe06dc50c04bf7b6257d1620dbec68",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/typeform/v1/social-cover.webp"
    }
  },
  "bereal-two-minute-window": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/bereal-two-minute-window/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "9659d9076cdfd211be49374d84ee22b024848c12dc41a8e766c92f7cb52f4097",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/bereal-two-minute-window/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/bereal-two-minute-window/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "c4526d5ee0ab92e3d0b4689e768bebfd243ff04054aefc5530dbd12f800ac615",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/bereal-two-minute-window/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/bereal-two-minute-window/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "50e3fe500f2f604fe9502d5b0f8090c38bb50bf9f9d9a232b9c1ae66f96c94c7",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/bereal-two-minute-window/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/bereal-two-minute-window/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "a9c16f63f6daf60db169aad26fa6bfeda0104736ad34de6c75876e302817e8ab",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/bereal-two-minute-window/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/bereal-two-minute-window/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "7e37f020e843268d092b7a96b1f48b3a1b035cc1c8a313ed7902533841a2a7c8",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/bereal-two-minute-window/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/bereal-two-minute-window/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "d3b8b0f2058ed8e8bfea58f09bfb1b2c361170e68eaf485a211a9f0bd7653d5f",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/bereal-two-minute-window/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/bereal-two-minute-window/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "25b29b3954a19400cba7e1c7b6efafbe35c8539564a46c335d49fde236fbfa22",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/bereal-two-minute-window/v1/social-cover.webp"
    }
  },
  "venmo-social-feed": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/venmo-social-feed/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "2ef86503040505afb4278f3bc551b8fadf13da18b9b0246ca7c4939331cbd368",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/venmo-social-feed/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/venmo-social-feed/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "c8d9457e994b467e3f3c9831e9e47d828bcab0328d8fcbb221d510676f08a8d9",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/venmo-social-feed/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/venmo-social-feed/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "a41b81db258f23fbbe303eedaebfb2bb0b49f53d318962e22080bcbd1028da2f",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/venmo-social-feed/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/venmo-social-feed/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "4b726d70f4ff995792dd20eeb31f966c56aea8412a4e559d19dfbe4f8cd6491a",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/venmo-social-feed/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/venmo-social-feed/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "d10552ae0cf81e8c9561ae030da0c808bf442392e7db9162a9f4d73ac5c4dd15",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/venmo-social-feed/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/venmo-social-feed/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "8b131a1f2d33337cdaa0ca80c93bd1a3cc2d710534bd8b1f17f59c431fe0da09",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/venmo-social-feed/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/venmo-social-feed/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "97a9b18286a57a590cd6acb3bea0788761de375a299e99ba692b7df7aab29b1a",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/venmo-social-feed/v1/social-cover.webp"
    }
  },
  "discord": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/discord/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "c530e8311b01dea69ec505829d2dc66198708d5c648fa51ca63eec881844929b",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/discord/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/discord/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "2c09747d6cac98c871a841e4a66800f1ded6ac4a7ea0aa05d58ac498c724ba0a",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/discord/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/discord/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "73e2ef510beda34bc111145897b61ecccbee1bb9f0bcb8c26c8d408374885320",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/discord/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/discord/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "4b4072271b2a95716da3afd953bc6f1363f3bc3d052446e9016e018267d5c7bb",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/discord/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/discord/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "eae4a69dcd1371da260a89c5ba72e6770bbab9e91d9c0b53479a9d04d69484d1",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/discord/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/discord/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "2c09cafee4265ddd535f16f833f84cfe590e091078481f44c32b5ec2536c6dc8",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/discord/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/discord/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "4de24d0507660eae90365593e9d7bea6f54633efe3cc4aab2ddce7e5f1351af8",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/discord/v1/social-cover.webp"
    }
  },
  "slack-origin": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/slack-origin/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "516ab406e289ffa1ff5730242d7f529fc4dafadc5fe85bff0e4d43375ed1cfc6",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/slack-origin/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/slack-origin/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "5313230092e503ce0829a699342e602b8f07e763de7da314b7e4d86481a98e66",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/slack-origin/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/slack-origin/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "7436653b2a909db83f326574dcea692991a8d9b46eba193b53bfadd5ef008d72",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/slack-origin/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/slack-origin/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "5d018ef43f767ffdfc34c4f32c0bcf9ea5bf4e197629006ed2b72a5e310bc36d",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/slack-origin/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/slack-origin/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "ec58311954ef07eab00f4ef9c154bb436974b858a31a8f883fcb438901e4c404",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/slack-origin/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/slack-origin/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "97b7b682a3429495e28cdfc8e3c70f2a74842ac2b6a72330734355929f8740ac",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/slack-origin/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/slack-origin/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "ad2d884034f3fcbd12891e06da3c490a1bf14f37f8a59c11efa8c36731c52e8c",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/slack-origin/v1/social-cover.webp"
    }
  },
  "instagram-stories": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/instagram-stories/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "744b343fd6509aa9fe85ae069b2077c6537e2c230ac817dd4d079850f7bdd9f8",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/instagram-stories/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/instagram-stories/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "d6a223eeb4e7842280d77be7942b957354a39129687d6fea0c4073ee6f425c78",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/instagram-stories/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/instagram-stories/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "c194f3954f061e0029b59e55708afea2966ee451730a3b5f518016f92f66923f",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/instagram-stories/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/instagram-stories/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "f770b2f22ea93855f20b289497000a4ebdcf1df00705638e776deb4dde47eb09",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/instagram-stories/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/instagram-stories/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "f6b6ef5e29644617e54b9ac9311abd640f91b34bea366a47cf863e92dd5db1fe",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/instagram-stories/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/instagram-stories/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "e9554ea5fd3298339106b9e51842e0058c26b558bbfb79f0081ff2df44aa440e",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/instagram-stories/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/instagram-stories/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "82b6f17b5ad17a5b9ba83573766cbe9b11930b679e3a33b274d73cc351b5f251",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/instagram-stories/v1/social-cover.webp"
    }
  },
  "tailwind-css": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/tailwind-css/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "cc9e7342392392e0bdcf6a7077df89b7be875527a9fcf313c5866290132a9eb9",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/tailwind-css/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/tailwind-css/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "a16fa90376522edc20330df48f6d02f379d7618d2970d922e18528f6b3887670",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/tailwind-css/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/tailwind-css/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "a7a3cd8458c5bab7fe1fdaaa8c694e5d8f617db72457d458c28672788e6c9786",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/tailwind-css/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/tailwind-css/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "b09478d8fde245626f894e0a8ce59b0eb6513931549a2d4a2aaba3b461c70a7c",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/tailwind-css/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/tailwind-css/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "a6ca66a840608172945a3ce81fa902c4183d8b0cb0a569b47da610eb08c98736",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/tailwind-css/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/tailwind-css/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "f6794ce05185f3ebba807b82f0c3e2eaba984d6d411f7b37a655365a53c14d44",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/tailwind-css/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/tailwind-css/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "65a614f673f8f2c0f8a78917ee9eaa74e7675fc2a8854e56c0076942e84daee2",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/tailwind-css/v1/social-cover.webp"
    }
  },
  "prettier": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/prettier/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "8e19bd459c9af4d99c8d1a266c310aa029b1c72ffa62dbb612c2524f56ce26e1",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/prettier/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/prettier/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "d7f9265c7cc571eba9ef14530084fe8978b10f111222a5565070125f9b00e225",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/prettier/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/prettier/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "bac3c9214eb9ac8d7d8a8ccfc5beb9a4fb72512208a4114d5d179c9eb216e4b8",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/prettier/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/prettier/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "f5fef9d2dd94538eb8653f00fecfb5b27d802970b6c2adab52c8be7ab8ca088b",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/prettier/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/prettier/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "974f2a18fc1ad984fb75ace0f167642ca5cc5504a5d2d38ef369941662f685be",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/prettier/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/prettier/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "3fb40269e53e1d2addd35dc2d5cf0957c6438503fe016d8d3d66c71eb66d9551",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/prettier/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/prettier/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "ae2008fa4e103e0d12824b54a5a9060b2fbb0c77b95533544ce9b077496a6c6b",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/prettier/v1/social-cover.webp"
    }
  },
  "amazon-one-click": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/amazon-one-click/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "fa16100a001a77004d3cae05d23104840c5a7ec621a018e91f5347a4697f534b",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/amazon-one-click/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/amazon-one-click/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "6b3b1270dd302523b26935f80aef9aa9a12395492c85c6dc8720438237b5b536",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/amazon-one-click/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/amazon-one-click/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "7d74b2f76268eac1b74713f6af802d9dff47c3af826b4269649b642524e25069",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/amazon-one-click/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/amazon-one-click/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "45d1e07d20966fd864ce6eab5cf1157898778a1b0c47dad9693639ce0cfa6d73",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/amazon-one-click/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/amazon-one-click/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "b3b5891b7b6efb3e395ed2ea996ef98da529689b7d858c1d48e08daf07b4dbab",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/amazon-one-click/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/amazon-one-click/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "69eaab9695dafbc8898dc24b23e1dfc9834aaa89fe4ba8f97e58a6be5af01896",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/amazon-one-click/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/amazon-one-click/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "38f6d78ccbfb6a373d1233d7813833e2bd2212c0fa620bf711106a10bf8c2187",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/amazon-one-click/v1/social-cover.webp"
    }
  },
  "superhuman-onboarding": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/superhuman-onboarding/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "6b09a9a0f45b693ead6749c1a02935ce4e78aa78c05f8207bb78db95d61d7bdd",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/superhuman-onboarding/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/superhuman-onboarding/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "40e60127f141e76b4b43ab0b63706edd8917b5c31ba6fc3913734c9cca768a1f",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/superhuman-onboarding/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/superhuman-onboarding/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "ca9d53665f62b39787349565b99694473278d0b4f54a7e4560d8334ad1662233",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/superhuman-onboarding/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/superhuman-onboarding/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "c355725230bf073cebf026f7fd9eff8872273be5f3c79b4672ca6597ea81bd70",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/superhuman-onboarding/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/superhuman-onboarding/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "756e4ad65812ae0e6df62daa5ed1d58224cb27ceedb912145f7e6617e98709c7",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/superhuman-onboarding/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/superhuman-onboarding/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "03d8eb5f41271910f1eb08bd7acc2c40da356d65cc0d3cc76d6dc744526ff5c0",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/superhuman-onboarding/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/superhuman-onboarding/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "02e208822961dd9ca444061dd18204c6103de11e4a8e3c6ceb620f397d216308",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/superhuman-onboarding/v1/social-cover.webp"
    }
  },
  "midjourney-discord-launch": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/midjourney-discord-launch/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "60bcdf470d645b18bcb7ab9eaab26606237f09aebc1b9a7cc7c98dd9da67bb2f",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/midjourney-discord-launch/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/midjourney-discord-launch/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "bd58b51921dde00bf4227dbc4435f480bd5a41f520c95a54da19ca57af6c16e3",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/midjourney-discord-launch/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/midjourney-discord-launch/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "e92737600fe7d2e5e642ab22d628ddac60095a6e1d6612797cb0604a64ce9f2f",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/midjourney-discord-launch/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/midjourney-discord-launch/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "7cf3344b4a76abad7433eadf574baeb3bee0602d6857c5536e4b1aed4d2dc7da",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/midjourney-discord-launch/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/midjourney-discord-launch/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "8cbc77fa0b26390311e718de5b4e5520b0ddc0635f14d991d59879df02ae45d0",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/midjourney-discord-launch/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/midjourney-discord-launch/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "e0836ea29414a385d28b1290f5257c0beedc504bdd560d0b3dba9ba8fe2080be",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/midjourney-discord-launch/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/midjourney-discord-launch/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "0ee517701a47ded384df54bfe260ccf9e26acfd551a11a744945be781237c1d9",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/midjourney-discord-launch/v1/social-cover.webp"
    }
  },
  "perplexity-early": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/perplexity-early/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "2b9c9849c0a2e4901d7d0a786cb8f5f1ddd67f2d42be6be04fad1d339e4aaf30",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/perplexity-early/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/perplexity-early/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "efa4519a3d3f4ae17561377fce037be5d42723698f62df5b92a8e8b73c9a13b9",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/perplexity-early/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/perplexity-early/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "b3b17ef9a75ab264d31f0ee497ab3b1b3b310837e3f297f49e7afdfaab2c7b9b",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/perplexity-early/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/perplexity-early/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "42beda4808e08c791446daac7ff9c7e1edbafdaff774384f25f09ae3369cdab4",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/perplexity-early/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/perplexity-early/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "1bcaa9502ffc07e8d6414db9077c9806f4c41bf69537d8f0a8ae92d6d9c361fb",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/perplexity-early/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/perplexity-early/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "e0fbf1ecd48b8363a39c777cbbd3309308d710a7b020582c82e9b6b14525b678",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/perplexity-early/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/perplexity-early/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "b965b193ea8890eed4467fc636f9a3037971063d4c3a120dd85befa9c3441391",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/perplexity-early/v1/social-cover.webp"
    }
  },
  "notebooklm": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/notebooklm/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "4f9e607582edad590e8d218b5bf1606faf785790d99a4eb7097ddcf2fae8aae4",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/notebooklm/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/notebooklm/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "33a36da72ecfa3be2efe7787379f5e571a67c2a581ef55800ed50dce56465768",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/notebooklm/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/notebooklm/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "42902f10a36268171fc6052dfdb95a58d59840c7f819c48639957046550fc268",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/notebooklm/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/notebooklm/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "17bdcf5dde1ffbcc24d9cbb194b3fbce2d4a6bc2b7e28bc1bdff901037a6940b",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/notebooklm/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/notebooklm/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "ff91ab1985b9978bfffe900a8a19ce6df74ddabcad95c08f891798712577cfb9",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/notebooklm/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/notebooklm/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "5e38a341562ad7731ddb5f7616f751cfc8c46c55a46793a5ea0c68c9aa344b77",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/notebooklm/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/notebooklm/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "1f2a0075ee3f26024aa1ebb35ae52f7a4be0514f1653dc92c080b472a876fe37",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/notebooklm/v1/social-cover.webp"
    }
  },
  "elevenlabs": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/elevenlabs/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "038cebbd631648df1a6b14d5406908bd6127f33998bad72b0a494e7a8d15888f",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/elevenlabs/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/elevenlabs/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "d5a57bbf36ea78a576702cb22f683734a7ddeffab3e0a67df862c52c563da482",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/elevenlabs/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/elevenlabs/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "2b9f42a275a5c0b5a10f364ad3179bfb4e8a25c208a3cea2593ce81131558804",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/elevenlabs/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/elevenlabs/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "a6d78c45d8e301e82283ead153fc8f57bee13e6cb1674838f4186ab97d815c66",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/elevenlabs/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/elevenlabs/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "14c6fbd924449515fcc84f77d44e8ddface31ece44e5c8030077fafb22fc9d83",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/elevenlabs/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/elevenlabs/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "20c1e75e99924a72a42c53c4e03320d3bd4a014a248449541c6b8d8b33cd2f86",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/elevenlabs/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/elevenlabs/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "7aeb85245bd694c87008911bd554e5b345bc476e940e37daa6de52f12d5540e7",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/elevenlabs/v1/social-cover.webp"
    }
  },
  "cursor": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/cursor/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "2b14aa5354b2cf8332e22da1dff85fdb68bb5b7cc4f855bdfa0d1385dfa298cf",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/cursor/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/cursor/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "a88ed42c2515473fa25bb20d28108c7e12faa56867c2663539e21bfec17929fc",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/cursor/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/cursor/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "5b6aa3e779e8a25449b4587404b1f8a4c52631c3bb0884d30d1059c449886087",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/cursor/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/cursor/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "83d4490124c29677578a4b15f9080b0d9ae2fe5202315df6653fcd600805c71e",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/cursor/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/cursor/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "b3c4d20321735f33b5c2bec92c194ddacb9a046d4634027899789e6069fcc92a",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/cursor/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/cursor/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "8ede82fb9eba17c847488bf6c39f335dd7d4fc0bbb66285dd0dca1ea1cda7208",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/cursor/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/cursor/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "400596538c812fa3a33f39d27a4984db0059be4bc37336ef491eaba70f5bcea4",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/cursor/v1/social-cover.webp"
    }
  },
  "gamma": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/gamma/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "b86efedd167b77cc6111b33c0433d0d56c1f9482771655a99c5b8ab57ad4d146",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/gamma/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/gamma/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "a2514ee34f40a4146b1e8d1d1655126188acd0b94592079988d79479d3f50bc7",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/gamma/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/gamma/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "49920014fae22418a28b0219977a22c85955f6f1a71a07ba0780c325838f6559",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/gamma/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/gamma/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "1100d211d93df18af2906ea90617a94e711824ffec5d6ce8e6e8c9db83c7316b",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/gamma/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/gamma/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "ff6ff3fb8b9748928cd3cc01771d0453d8fb81b544c4217a205170e9ac428857",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/gamma/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/gamma/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "536c13e2d017212e1e111634abc5226a630048ebf8958bb58ebd94208db92e96",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/gamma/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/gamma/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "c0c164cb152afcffb27739adbc80a34e85fdf6a0bf3118ba7775451b38a4e0fb",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/gamma/v1/social-cover.webp"
    }
  },
  "vite": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/vite/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "bdb4bdef9d32987eb787852741765d7df385515dabe66ba2ab8f1f96ede2a6ec",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/vite/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/vite/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "a69e29de5db61fc1d6cda7a43ba2243f7d901bd4cab0f8f90ecb488abb7dcff0",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/vite/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/vite/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "d2e88ffc78ea698c2c4ec2064b55c490e0a0de2eaa06e896690b86253b8c66c2",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/vite/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/vite/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "e346e9469308a5a8eddc1de963cc010e370228a4e929001f329ed1a8823f1b89",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/vite/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/vite/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "cfdae70c27f0aa81b9a057744daad845600511daa1c36dea972a8cc30e226386",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/vite/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/vite/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "a59110b7884009eaa83e25219badd99bea2cffac66cd8e4333cef1cd445ad669",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/vite/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/vite/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "34f360069b87d6ceedc260c3867425700e5389d4ee83468cc97a41d2e14c40a5",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/vite/v1/social-cover.webp"
    }
  },
  "linear": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/linear/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "51d5893558e0bc857e7305f8cefd823eecd12ba154b22b48ca990940b2f2c482",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/linear/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/linear/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "5954d197e58c1afa08788d0bc7cefe9e6b55f9b731af06fbf5b1be7d7e42a7a0",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/linear/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/linear/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "903578c7ae8fa60e57f63e5c52984b1d560fb0d4c7548dd74e7572e4923fc799",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/linear/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/linear/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "4523ffcd1ceb4608073831a0061aa10bebeb0fcd837abc7ad146ace17ce53470",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/linear/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/linear/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "6fa4230ee3542344255f521319ed8ab5738d001bebfee5371e306ca1302eef2f",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/linear/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/linear/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "195ead6470c47943d1be1367410bebf95bdf092938de6fd59783ce9f67ce4472",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/linear/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/linear/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "29d886acc74d11236e1ebe3213c03057169cf17683d6ffbbdee101cf1d1a691c",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/linear/v1/social-cover.webp"
    }
  },
  "raycast": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/raycast/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "050f7a5c435e1428faa7e177f9ae83adae2311c875d953954a77fef1757d1514",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/raycast/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/raycast/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "d6d1bf9553b5e0c492a04781696e7abf2a774957fc2ac4e25b751fb6fa0bfd0f",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/raycast/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/raycast/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "5ba75a35d2386843eaa928703a5b6d544d385227fd07b7d93aa47fd4776fb862",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/raycast/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/raycast/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "a07d7048b0a90d24363e65153f6b2b79dc67d9b1f2d32d013a47e3cb27095d59",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/raycast/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/raycast/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "852b74f38581b91bb7bed0dfb8a19d154ae6a10e2645a80c2d33b273dcc9e7b3",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/raycast/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/raycast/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "db6fc09a818f7a6c412ce0c05a7a8d89d63a632ca31051dd57c634e02b275608",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/raycast/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/raycast/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "bbd91c02b0dbbf2974b4d49b62f984d5657729cd8107cf76a92373cc429b53ed",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/raycast/v1/social-cover.webp"
    }
  },
  "supabase": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/supabase/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "19d45bef55a3626b151f7eff84195928ff825bb3ed92e45605be2150261a077a",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/supabase/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/supabase/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "d9d8e1065d5366cb99da93e26589114199b0fdac12122e4cdadd6417de14e10d",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/supabase/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/supabase/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "73087127fce299d3aef4a397d70eeddd7caaade815585ea4dec2714fb6b83f4d",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/supabase/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/supabase/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "260dd626a5221ae97c5527d8a48e07562ea73b196e49c5a86d0a46cda9dd4848",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/supabase/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/supabase/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "8aa6a922d4a21e423d19f013728d36d429b009afe5f951b836ea37d4ba609e7f",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/supabase/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/supabase/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "6787f48281436bf515d77f31c4ac32c15b6c4e9c1c6be99257ac70b8dc422bfd",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/supabase/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/supabase/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "4e8c0fea2a72c2e1b80f8d2a2c09aff44fa17181e94c71d4fe8248783603d030",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/supabase/v1/social-cover.webp"
    }
  },
  "obsidian": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/obsidian/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "31a82073440b93f58bdb5afc8bc3c14d33442da5e70d52d9468d03eb7de8e2ed",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/obsidian/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/obsidian/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "2a5ff7579878272c183ad143ea8591900b8fe45e1f3fc49712ef3e82ec70233f",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/obsidian/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/obsidian/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "aa40a6d0dabc41f6d36de5b05b316151a362a27a9e6d57d67f18528b1a003336",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/obsidian/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/obsidian/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "eb6cd7f0247f3a235dd7288d41eea7d9c9202ea55f3dc150769467892142b66f",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/obsidian/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/obsidian/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "2e4ae544804a67fe6c2212545f29f7c179267c58cb6c1d0d0ccdd5ecac24553f",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/obsidian/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/obsidian/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "285f6fb2a96c1a1300ee112699fcd9a02fa36106ef1426690cdc346572627f47",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/obsidian/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/obsidian/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "3e92315bb0f0d0cff31353e2de582d7d540a63befee7b50876f28ba166eaf2f2",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/obsidian/v1/social-cover.webp"
    }
  },
  "morning-brew-referral": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/morning-brew-referral/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "f59c2616d3f24577a953285c819768785a7551de55b626da4315ef5e7e2604bf",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/morning-brew-referral/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/morning-brew-referral/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "d4b4299e127f0036d06bcefca3e1f73af5ce1c43b22a47bb91f2f88189352922",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/morning-brew-referral/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/morning-brew-referral/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "bd7dc92b4e0e057d1447435d0a6405d4e94be68a9cb89335e0e78a194c90b01a",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/morning-brew-referral/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/morning-brew-referral/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "9de821637b49d0442baec00b917651ab0bf083302300fc58773662acc03a2bf2",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/morning-brew-referral/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/morning-brew-referral/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "4a24400ece78e41c5c0a870be4c0be47fb997b941e9fc61fcb978b3b092b7de8",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/morning-brew-referral/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/morning-brew-referral/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "3c81df514d1aacddedd4fb99fa5e2544df280f8a6b4cc93ec62f86910237e931",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/morning-brew-referral/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/morning-brew-referral/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "1c4f6b7140eb63803f5bc54fd97185a723246c474bc51b2670eaa3c88aae258d",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/morning-brew-referral/v1/social-cover.webp"
    }
  },
  "arc-browser-invite": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/arc-browser-invite/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "2e2916bb7835a9c3db7efbab6b1bf8b033d0cd19ef22973d48a7cebeffac69af",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/arc-browser-invite/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/arc-browser-invite/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "88afae899e15bf7494740840c02bc7b40433024fa18e6fe913b9dc1e06e98cee",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/arc-browser-invite/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/arc-browser-invite/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "acf58897f1c98d9dc5f928b596de43963f8d9c2d0b5aa1de40c07483a7a8b6a9",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/arc-browser-invite/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/arc-browser-invite/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "c95bebfcd622db91fbea291234e345dcf9d3925461151f02156e0a90d2252ddd",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/arc-browser-invite/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/arc-browser-invite/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "e7e4ef5da46abb02a9f1efd039068dc578eafdd2b19c3828fb80c848d6abba66",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/arc-browser-invite/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/arc-browser-invite/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "114e3a504d1029cdc0a1a5b990a4904426453988478f14109818154fea6cfc0a",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/arc-browser-invite/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/arc-browser-invite/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "2f1fad9929e939d7038ab3af7e9e20899c666a85c7a01532241fdb016d9118ea",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/arc-browser-invite/v1/social-cover.webp"
    }
  },
  "figma-free-for-students": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/figma-free-for-students/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "14c25568778095b10d5dbb5c6ea4b189f85ecb96636e8cdece41b0ddffd12a19",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/figma-free-for-students/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/figma-free-for-students/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "75d815e23e397ab456b1cb12cfc7b5aaa17babda4b157037dac046955967fb1b",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/figma-free-for-students/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/figma-free-for-students/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "966c30228d97b56b27a63a5b820beec701cd467e7f2e0b239ee8ef1fbd193b75",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/figma-free-for-students/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/figma-free-for-students/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "dea271dd33e3249d1dd9c2ea0756dcf5c7b747178c58c03ca1a2c656ee4ee9bd",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/figma-free-for-students/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/figma-free-for-students/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "12067a9abd23f7c846e121ce3bb0f89341b1429d2a52eaeb8908cb37c5a5c502",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/figma-free-for-students/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/figma-free-for-students/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "a4a0c0dd27955632cc11af16a54cf9acbf7859e8603e9f7267e06f0ff61c3be3",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/figma-free-for-students/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/figma-free-for-students/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "3c298821c4ef680fe6b460b9469f95ef37c2f4148f127b9539a31b030aa62d39",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/figma-free-for-students/v1/social-cover.webp"
    }
  },
  "substack-newsletter-import": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/substack-newsletter-import/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "c8fa4789486efa2dcf31883822dde46e2e9847f241a3ba698cc2e26857839232",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/substack-newsletter-import/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/substack-newsletter-import/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "65239cf396f35b4a6da6f9836c85d5bc70f515c753b4f6670c0ffc6e14b043cb",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/substack-newsletter-import/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/substack-newsletter-import/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "cf65b6adf590aad3fbabddf5778f24e04e2e17e596099461dea1ef69e5758dff",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/substack-newsletter-import/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/substack-newsletter-import/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "b3c62e338ca7401e57bd5caf35666aac572a4656345ac68dd14f802a38e45cba",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/substack-newsletter-import/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/substack-newsletter-import/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "9d43be5740ae3522c453c83722d005d0dc81b4795456a150c1a223111cf64962",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/substack-newsletter-import/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/substack-newsletter-import/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "07df3a610c097951f0f059cbaee6df47387b47a41038bb41b7c7b6bfaf735092",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/substack-newsletter-import/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/substack-newsletter-import/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "6d6b86f7a7037348c0819fa193f0a23bb9094ecc0eb03147697be872bffb8f6c",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/substack-newsletter-import/v1/social-cover.webp"
    }
  },
  "cashapp-cashtag": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/cashapp-cashtag/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "66442700b1985da5831f39351e9cf6c2b98f9d52ac6b833aa89118c0e001d449",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/cashapp-cashtag/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/cashapp-cashtag/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "736d68cf5ceefff4607e07c1802ae580f0eb63d85f537b7cc5fe2d7acf35474a",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/cashapp-cashtag/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/cashapp-cashtag/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "d85350433cda605090137ecc691d77d0bee90e21027a7c63e5e1e57cc0ade5d7",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/cashapp-cashtag/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/cashapp-cashtag/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "cc2dab1d9db4b05aa2ac74bb8b9733310ead62343f5c6ad833f837460118a585",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/cashapp-cashtag/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/cashapp-cashtag/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "53e906d5ba3e36b6b840468fba9dbaf24940245272f9793b06c907d6473040f7",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/cashapp-cashtag/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/cashapp-cashtag/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "39c8ac4d2108f69406343087fee7afa1d9ce37f1356b72a6ac24f9b5c1d9f290",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/cashapp-cashtag/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/cashapp-cashtag/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "d37c333e048cb93b9d2a3f9d5c4a4b2f2b6736a7a5d2e07101707668b895da33",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/cashapp-cashtag/v1/social-cover.webp"
    }
  },
  "reddit-upvote": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/reddit-upvote/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "df5949829e802446fc167ab57a1ba29758c56cfc5d11d07b64580293274ffd30",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/reddit-upvote/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/reddit-upvote/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "7ce309fe305f40934bbfc3ed9d5cda6f97b3f264422bce544421c13c3639637a",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/reddit-upvote/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/reddit-upvote/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "bf3ea35107fcb37f8e4d55a7cf063458d912604ac22172df77a1740000d38e49",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/reddit-upvote/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/reddit-upvote/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "6a3c1b60028e33b7f74f2539726fdfac77c73c595668323d74e46b3b301d088c",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/reddit-upvote/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/reddit-upvote/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "c296c3ff321c6475271fbf10fa538bf3990cca7243d047d19a098c53f1147238",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/reddit-upvote/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/reddit-upvote/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "d98ca01cac40d4da10dfb1897ded05c660747b337a6d42feca59f8ce2b935349",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/reddit-upvote/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/reddit-upvote/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "56310b5a0b0880fc7da9b4b92002b73c16f4cd4df19fe674a320b6d980aaffdf",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/reddit-upvote/v1/social-cover.webp"
    }
  },
  "snapchat-disappearing-messages": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/snapchat-disappearing-messages/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "9993ddc70c6722193f9d5df55665665129ee4c70d4bf9fa42c4e09af13764467",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/snapchat-disappearing-messages/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/snapchat-disappearing-messages/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "4344b21c7258dce7d372bd21f48794c626a3b04109e3e409259e184ce2aea172",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/snapchat-disappearing-messages/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/snapchat-disappearing-messages/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "e752c25031c4a2f66fd5ee77e4e9b394a22fba5752305c9bc4014412d21377db",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/snapchat-disappearing-messages/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/snapchat-disappearing-messages/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "fda70e8aa73fbd5f11d95c14ed0f5182c8b21c1288bedb8bd1b37310ecf1f841",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/snapchat-disappearing-messages/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/snapchat-disappearing-messages/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "743c572f2245cfc48099ac8492119687866efa1076b29e2c6de2c3c8ee0a520e",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/snapchat-disappearing-messages/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/snapchat-disappearing-messages/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "f64ec281ef6d46017a0081c26be2826430a95adfe0228f0fcee91c20b3a6ee55",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/snapchat-disappearing-messages/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/snapchat-disappearing-messages/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "a1cc6b36b6ec0e11018b6f69376a089ef7c74c44735931feb461789208df9f93",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/snapchat-disappearing-messages/v1/social-cover.webp"
    }
  },
  "twitch": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/twitch/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "b12000abae864144d1d79573f9306cc32af56584f76263618998c4c561d2b404",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/twitch/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/twitch/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "896ad2fd84eb0d8e7dba33097820bac9686dc7f6ea8d0b52c729587c9d59bbe3",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/twitch/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/twitch/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "71531e001af45e7d8e2b561add893e296e59829477f87a553868e191498b6cf4",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/twitch/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/twitch/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "8853cfd1a572eb794026676d3bf6a60da098056fb3560e6ad8b852f45cc2a376",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/twitch/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/twitch/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "70023dc86d5b488be1de68b8a87b8b829dacbc73af90d62e08efd8b3ae264c8b",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/twitch/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/twitch/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "d21c35db23a2f1174f0a419de697f08e8c480779447c8590597a6768d8408c00",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/twitch/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/twitch/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "80fb1a5ccd6cd8ce96651b551ed69f86d2d1e44b1c253e39c1f80e0c6ce22446",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/twitch/v1/social-cover.webp"
    }
  },
  "youtube-pivot": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/youtube-pivot/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "11e29f46c16a493108872fee076862586307f685da7546692c500126a613159d",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/youtube-pivot/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/youtube-pivot/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "c0995e82556022cdc2f9ee9fd401c04034b919d20a6ca6fadbde25cd1f67b227",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/youtube-pivot/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/youtube-pivot/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "342081f35030bd468457c922ab84ad87c0ab781c676c98b6e898b677b904ba8f",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/youtube-pivot/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/youtube-pivot/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "4bec48db50b0209f75ea264becc939e8e9c36ed4f0cbafd91c47a00f667476a3",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/youtube-pivot/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/youtube-pivot/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "f44cbfc1d266602c862e97b3df7dce63ac88fad0319898ed4dc8c125dec8c26c",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/youtube-pivot/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/youtube-pivot/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "d0cca18be7ef11699d37d9c48cfd9e8203ec59d3e1ab44c64ce7c190d956391b",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/youtube-pivot/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/youtube-pivot/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "b25e7a1204e7f804a08e41a9880370b2b341a21bfedc49cc6299900245151a31",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/youtube-pivot/v1/social-cover.webp"
    }
  },
  "flickr": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/flickr/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "505258c9a1e7c9d3d21a785377be72658568b3ef427c8073db523bc34c37a128",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/flickr/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/flickr/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "ac98f43d7646d94124aa3aa4680f680842a56045ab3c67284b7fed0f0d6d8bed",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/flickr/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/flickr/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "2bcf16f73649c533073c369f36aee8a078286f880bda2c170f9df3590fb7b165",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/flickr/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/flickr/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "d865abf384f58c9a8bc0f2cca5b0358ae71ed34682c9b83d6e3c1320158f72a7",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/flickr/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/flickr/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "4a3a5c570532f34768299619993f3b4ed3fae41b9c2af46eee3d275366c68186",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/flickr/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/flickr/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "04395b679b302e4993dac34b34a18e79b9319774dfc9f62a95f044dde364dfd3",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/flickr/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/flickr/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "aa9639d2623ef7e3cb6f8b8442e2ad2aa759de24e8089735f8dd161f5833dd7e",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/flickr/v1/social-cover.webp"
    }
  },
  "groupon": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/groupon/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "e9d417dd15988f003bf70d12387aa0d9b8dbf3d61099a1fd05a45178620728c0",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/groupon/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/groupon/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "a68c75881d4e48f899e65258a6383884381dba1a79c756157e8556e22c07816a",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/groupon/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/groupon/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "f62f65f8efe2656f8ee588fc762af4709d0607baf60c6b7dc97c1941f84884de",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/groupon/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/groupon/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "e119932734c58e529fc725a9f56171b731169611817637d5bb2236327cf42f94",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/groupon/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/groupon/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "d8c1fea4fbe07bd8b470aa611d4dc1d4aa5ae99d435575560aedee81dc2436a3",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/groupon/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/groupon/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "ffe72825d000e5a82a41b2dae3b79e44f74315ab2cb20a4956028d0fea17e1b8",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/groupon/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/groupon/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "8693030a198a85970dc36747e43ed75ec8b034dcddb399a7619b8feaeccd4cc4",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/groupon/v1/social-cover.webp"
    }
  },
  "pinterest": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/pinterest/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "e72892015459f3d94a49c2ae6cde4b15c34999f2bebc12dc7289f1396eab8e04",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/pinterest/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/pinterest/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "c7ac71e17fd4daebf461d19e589751d53d65e0ab1612f92e2243bb924f544fcc",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/pinterest/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/pinterest/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "0ea8fb515cb5d7a9d2362e8d0848d0186fd4f5c3c8afdb509cae027bb1921e0f",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/pinterest/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/pinterest/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "a9641e20e685a52089b8397ad5cc6ea776f6b7245834aae7267ed6ac1dd74738",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/pinterest/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/pinterest/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "729b6bd23e8ffb51ace72f8a07cf0383ceaaab3b71ac91f5ad3b66fb34c478ed",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/pinterest/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/pinterest/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "1d853c5dd6da9d63eaf5ba2888eed0deb08cb7b5ac43ddf007e2c71524d1918d",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/pinterest/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/pinterest/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "843387f2f8bac311dfd4f63f17d85b1c4c0ee596d97c86e7f6f4a9e4d3d1c0c5",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/pinterest/v1/social-cover.webp"
    }
  },
  "yelp": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/yelp/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "db1d4132d59b5473d153ae38512153ea9142f20d70748c8c85d812789ad99b02",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/yelp/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/yelp/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "5c7bec114ac3fe985af18bce3ce04521160893154f24430eb3e517e748668890",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/yelp/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/yelp/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "26abbf3c6a3915e17580b9f96e6ddd8e5409a7ad6aed2d27406cf8b230e5f9a7",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/yelp/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/yelp/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "dceeb53fac82567930350acabf2b4eb5186277338cba87bdecccae9d2c168be4",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/yelp/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/yelp/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "2495d653a5459db676d0a1002653b25ebfdd39a5719186c2a5e9e511645fd50b",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/yelp/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/yelp/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "379dd73579d2d189c4f80a109fc385b759c8848a3ae49b1ef0b12006125e0c91",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/yelp/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/yelp/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "614faab47477fc047705b1038e622b8724853d45b3c238fc525da2e0b81c8b7d",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/yelp/v1/social-cover.webp"
    }
  },
  "pinterest-save-button": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/pinterest-save-button/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "540b35bbf25016a3f2762f7604015195e7c521dc91250674b5e733b4a12b36f2",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/pinterest-save-button/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/pinterest-save-button/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "d87f123eb61a6b7867c2605aed829b5f1d31bac9c5f15918565172f61adc3064",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/pinterest-save-button/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/pinterest-save-button/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "5a16a0e43b26bcc9b80a56eb754a77ff99906ff3fb2e43c4068fbb23632cf310",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/pinterest-save-button/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/pinterest-save-button/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "184ec4acc54dd14614220990eac37ec237618b0a654a65881547b0ba6213aba6",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/pinterest-save-button/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/pinterest-save-button/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "419672716bd44c836a41e48ad9de31cedfb0a9841bc2fb3d7446c10cec8f7bab",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/pinterest-save-button/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/pinterest-save-button/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "64436cb728fc694d43ed367301072d6935224bc464e147ea1cd596d4cddb5538",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/pinterest-save-button/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/pinterest-save-button/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "86d9c921ac8384864c26232bffa4ee76e51edcc1eb87449b39526c8dccfc5da0",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/pinterest-save-button/v1/social-cover.webp"
    }
  },
  "loom": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/loom/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "987f398a0e20cdc72940793dfa6c2d19a1570680f8c9c7a63104114504b1d806",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/loom/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/loom/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "82b4144114146856d68e803c1f49df7deb2157770cb2ef92d20b58f3769d2b6d",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/loom/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/loom/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "74fc5cafe3789cd4f8f4011be89a9377e7db3dbb22523f3ac1bbd302c9b6af0a",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/loom/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/loom/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "ec53f46bf8ac2646d7b528ef9bb29cad02d5a67f82020f17c9714a3e5386d524",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/loom/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/loom/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "597b439e5dbe74917cd79ad28f59aa0fc41f69e70c18fb56a25158b69fd7dbac",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/loom/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/loom/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "62ab28bfbc02d019bb5bb1fcfd5df6d4c327a748f1df2cd824d396cc6ea5cfa8",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/loom/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/loom/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "a32c6b81f99036534a7c108ce08262d06212a1ce027607bcf2b325101a57369a",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/loom/v1/social-cover.webp"
    }
  },
  "oh-my-zsh": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/oh-my-zsh/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "9ed66dfb76a9a034e77386ae252ecc69bd417e9fe7b867b7b30cd452f230fe11",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/oh-my-zsh/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/oh-my-zsh/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "42dee4bbc282d247031fd73018203f23c1fff850903141763c86d5f0e5e4b09c",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/oh-my-zsh/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/oh-my-zsh/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "b39b03624894bd2c52c8fdb67ee21b9aea51552a61bdfc6e4e176471de727a40",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/oh-my-zsh/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/oh-my-zsh/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "cb712bba37d288bc88b9725849ab2383a70bda543bf79900e0fa497f501c43de",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/oh-my-zsh/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/oh-my-zsh/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "76c7e057b23940d957c8d323312e22eb09d2de255adf3343da41655585538eef",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/oh-my-zsh/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/oh-my-zsh/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "e6e08395b3a4ac46709f4558f0bc7ed1ab6074b2cdaeb598257b72909dde8b15",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/oh-my-zsh/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/oh-my-zsh/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "9d1922bf8e44118448a83945c0c6131210d3435ffb57d2a2e5beda6244581a19",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/oh-my-zsh/v1/social-cover.webp"
    }
  },
  "homebrew": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/homebrew/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "51b7c8cadb46643e081de952db8ad4b7959ffbb76f4b7ec98ca3fb37be18bc75",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/homebrew/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/homebrew/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "8b76eb0b53e0c9988045ed0965b48469bad311980252dc42ccb6c052ba32d2a5",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/homebrew/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/homebrew/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "4273d6b6f34e114335576c0493991c349f6bf4685f50e345ac7b0515bdf926a1",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/homebrew/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/homebrew/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "83d33b26679a7c2f8f3f81933a62b0003ba78e2ab328264249683e6b08049f7d",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/homebrew/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/homebrew/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "bbb352cf778c08b18ef6c993a20c2b05cd33cf3c086e7cddbcb91df424874832",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/homebrew/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/homebrew/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "213240dc09975162775711f974ea6106857a04efc90103b4f51ba1925ff703f6",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/homebrew/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/homebrew/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "635714935f6653c2d152f2d87aac609d5966726f7c2878ad7d32e0fad40ea5c1",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/homebrew/v1/social-cover.webp"
    }
  },
  "sqlite": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/sqlite/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "3af166e75b5f76929e98f174779a0f0a21afe0acb45b8d4df8aff313d2ee4ae9",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/sqlite/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/sqlite/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "19f62dc1d66ae389cd43017872a13d8fe3d6dea5d6562453d30f169e3dc8878a",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/sqlite/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/sqlite/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "6d81fc2abc64fe09a5df5bb80783379df2768c45a681d55d95145a841b059342",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/sqlite/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/sqlite/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "a37b8a67e6b3b178b68dec57b5109d6525d4770ed3585eae7dea6f957a081ca6",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/sqlite/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/sqlite/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "52f43b1a94cbbc67e4085107b05738431de89eb438c6e60f32734e3fc931c42f",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/sqlite/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/sqlite/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "d6add50faea92185fc2ca80e35bfe040309ba3cc28aaa34ab7edd9942fd906d9",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/sqlite/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/sqlite/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "0db6a668a706627a85534d6f3562ed7da4c9332012e08c980f733c8ec8933d6f",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/sqlite/v1/social-cover.webp"
    }
  },
  "redis-origin": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/redis-origin/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "1dae6d2f12c33fa660fa15ca2b671a0f76d0cf32914dfed6cc267ce472605a1c",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/redis-origin/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/redis-origin/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "45ac97692e9b7ca8bd2fb4b08d363e41fb876facf79e0f44fcf35205de97c24d",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/redis-origin/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/redis-origin/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "bf08bfd3e2bfa5cf1b1050ec8a7c7d9efc6d5bbfdfae8916c3fe17b330687181",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/redis-origin/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/redis-origin/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "d923084b3f9aa3dd53193ef8a7a8d5890e0459be71299c0a570d4ce85bd4fb8d",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/redis-origin/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/redis-origin/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "dd1a4846d36d0f5e12e06d5e28c6570dd091c640c4f0b9d1edcab9c1c1ea062e",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/redis-origin/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/redis-origin/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "b923a3f321af8426fc14fce0eae3007f7e769f61406250755a05dc3bcfa3b38c",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/redis-origin/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/redis-origin/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "cf7c48aaefb6e502b3bf677c506651b5731a2677147b9f6b6b4b07535ff8fc7c",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/redis-origin/v1/social-cover.webp"
    }
  },
  "curl": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/curl/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "e1fea51d55299c902ee791a36cd87f560fad0ba8944a38609ec1c88291af20d2",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/curl/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/curl/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "9f090dc8ec2b66f21890999dce43543d4e5ee1a2c5f29703933130b0eaebe1a9",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/curl/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/curl/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "e705286d76b846fb8c63a82f34d6feba1770fb8c2d6b5efb672090b849f9cd6c",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/curl/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/curl/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "54aa9318826321cfa711b64a89f1180768d5eced687e335b37c502d5cf64a1ec",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/curl/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/curl/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "6d5991b73375b54e8cdf6869315a664377d72c019d401201a79c9a9ee5601b78",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/curl/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/curl/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "59faaf36ac3872b2d4daa3950ec4304e80ec17ee421949807bd36c21b65078fb",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/curl/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/curl/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "754e19ebfad9593a26c59e764e9418fff8a25512beb6b0d17a6fde0d49ffae7d",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/curl/v1/social-cover.webp"
    }
  },
  "eslint": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/eslint/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "74eb4ef108086f517d09d26a6a37cd7a4a2846993fa6a96a58117e9c26b158fc",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/eslint/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/eslint/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "b2f18c12b76b127e41d33b255dc486c56508d8d493e086e1bb84227311f5e47d",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/eslint/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/eslint/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "54009d4eff82484662a05b0454f462414ae6e04d8dacc0d65a5eb71f1edddaa2",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/eslint/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/eslint/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "f85d4082f5b1d89a06554ac65046a3702986914edb0ace2f679da7b9d55dabd3",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/eslint/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/eslint/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "0430931c85b1d5f50acec5353264044c39e06bb1c2dafdebe28e466d62e6a0ae",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/eslint/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/eslint/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "5775c41ab94eb892ab202655ee8585dbae7c1d60f78b296011580def600bc7f2",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/eslint/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/eslint/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "9f33f579981427fff782d1b91177c488bdf6cdda66606bb5034015a837a18dab",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/eslint/v1/social-cover.webp"
    }
  },
  "axios": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/axios/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "849073cb45280ab8fac3418a768ecbc6a2b4f2c2a90a0b2247c07fc5122011c5",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/axios/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/axios/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "5c53de783586471f90e592c9269ca9ed794aa68bc61eedd3da342758ced831b7",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/axios/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/axios/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "61a7b684287a15d72dfe646ec4d05f759de752b895e59e23fa667346cabca6ab",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/axios/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/axios/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "55f887bd51b7084addfcc988d97478e0d518e0ddf91d632815c7eec589b5b81f",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/axios/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/axios/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "aee269b7d6a9e6897f4551be042cb4240de25dc2bfe2b934f966cdf88ea79979",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/axios/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/axios/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "5fd6852401f154a0a0bf2b069d8787931ff5dd114b124447bb13aca4aa75cb86",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/axios/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/axios/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "5aa71486989a3a31f1834ce691e93bb96641d60a13d1b3d7fd9d1a7a3d9c4e74",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/axios/v1/social-cover.webp"
    }
  },
  "socket-io": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/socket-io/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "6c30e5b6b57c645f967c3c3c2fdfc65a0004d2e8ca0a356fedd2d1cf76dfc962",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/socket-io/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/socket-io/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "912146bbf32e67f7692e336fe3e95983d2a069cd57a77dd8ce22f1b7a150fbf8",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/socket-io/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/socket-io/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "2477096cacfc59c7e4957d0e34a97e3dba2634b97150f4395d484896a6ed4b47",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/socket-io/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/socket-io/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "6fafda13b91877636094f45384a4853afcb00903b9f4dca8531632818211959c",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/socket-io/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/socket-io/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "bf59fba5fe768dfbaa6314bcd50fc98ed280d7789a77ade437873729b15c3cff",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/socket-io/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/socket-io/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "cde831e971bbe5d6b435318d82e13040aad1761de0a33667e6f5219f21cf400f",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/socket-io/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/socket-io/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "af7d553f3bde2e1bac745653be1c5155fdea0287488d14c86dc967a54d9c013b",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/socket-io/v1/social-cover.webp"
    }
  },
  "appsumo": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/appsumo/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "2f7236e4f0a2bb5230aab63e319fadbca266d39fa46ee330e32ca1d74541f77f",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/appsumo/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/appsumo/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "ba013201d63fca5aec9b5cc866a2968dfbbf2954ab7a782d5cafd505fbb5cc25",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/appsumo/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/appsumo/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "a04fd956e058ec46945326b8852d63138f56aee70c9d1d5358f57df51107c191",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/appsumo/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/appsumo/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "d99e3bca49f1d78bdb7a05ced78d11fae57af14a5c6aadf54425763b86379a91",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/appsumo/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/appsumo/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "e81a5270dc2e55fa26af744213a8c76d914e24a2f80e91e7e0a226722ec9c34b",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/appsumo/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/appsumo/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "60ad9a27624e1d8c6c5bd20b6deb4d6e504ee55d1e5598e20ee1fce7a4b99646",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/appsumo/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/appsumo/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "b6b7f2b083eba9b40672347f1ab60847c4697f3e56cb37a6877a169558c59c93",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/appsumo/v1/social-cover.webp"
    }
  },
  "nomad-list-pieter-levels": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/nomad-list-pieter-levels/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "d4f9ec63105c19dce8a8e5c05b11c79771f0b97b9210dce8fa14c68b8f7159af",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/nomad-list-pieter-levels/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/nomad-list-pieter-levels/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "b47ee3b1dead54b04e61a0e14ddb8f8dcc1cafce5883fd665b65dd1c67dd807c",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/nomad-list-pieter-levels/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/nomad-list-pieter-levels/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "35d3738536d57b9be345f222d8483579a244cd08edfa85ad8ea90340d0012acb",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/nomad-list-pieter-levels/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/nomad-list-pieter-levels/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "b725a71a44703ec26c9746b0e2ed20cee2c64ea158a842f03068b11003eec004",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/nomad-list-pieter-levels/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/nomad-list-pieter-levels/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "948c6319f5350cf059a7a29aa94d1dcc8749001f02de81749a37f251f5e9fadf",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/nomad-list-pieter-levels/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/nomad-list-pieter-levels/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "de15d0ee270fa33575b1d9510c053266c2ddb52fa559961071fbb966d574aa17",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/nomad-list-pieter-levels/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/nomad-list-pieter-levels/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "47009909ec1d3c109368898bd2bf2f3c190c06522a13be6be77facfc8d81bb66",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/nomad-list-pieter-levels/v1/social-cover.webp"
    }
  },
  "base44": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/base44/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "c66fb991e4b75fc4e6455c844e02a71b99bb818ca682b6a8dca44d02a35c159e",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/base44/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/base44/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "45eff737d903d749024a117d364ce39737821bf03ab02a1353db95984fb28edf",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/base44/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/base44/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "fe4320e161aab780b9a870cb3f7f49ae8602d92e9dcb356ec2094357fdbcfa23",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/base44/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/base44/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "e91d0f9820f766c3abc1822ea48d5be100c8b16af80bffa7e983ae9d15ab3476",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/base44/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/base44/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "45856e7be983f1c10cdfc049426acda6cccc06a5d2d5d689a9847ce197148cad",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/base44/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/base44/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "5f4036160a95e1b50c33e7a0617b46ba76272a41bc2af227955c9624ab7e139e",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/base44/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/base44/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "983904c856d85e632b46ab4d9fa1bfce5a797ac7a5819c10a9b22bc05ead0745",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/base44/v1/social-cover.webp"
    }
  },
  "pika-labs-discord-launch": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/pika-labs-discord-launch/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "14a0846023c339d62f3922b2f224056642e1136e3a9a36fc470657ba5aa66574",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/pika-labs-discord-launch/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/pika-labs-discord-launch/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "b84551e73f0bcdff856e630c51a0a27fac35987327ba1e4b3542e747228186b8",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/pika-labs-discord-launch/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/pika-labs-discord-launch/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "27432226b3b6ef2803b8e04fe8a5e2cd9fc0dbc2ac773b4e88058374369788ed",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/pika-labs-discord-launch/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/pika-labs-discord-launch/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "687fba5f727e5bb1a981e573a318b1e09345372a864f07d594c8d261f9da1f68",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/pika-labs-discord-launch/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/pika-labs-discord-launch/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "8df5012b612fc74bbe7a180ff502367b0f872d9b7fd1c45839db0837aef1a25a",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/pika-labs-discord-launch/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/pika-labs-discord-launch/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "6724005df12ebe7cf2735d9ab7534ac3e962d88433fa512a1ca9ecce4664ec92",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/pika-labs-discord-launch/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/pika-labs-discord-launch/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "9a35dcddd5a967a9738da6b1e445122e88d1c5423fe1691770916fcedc6c94d9",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/pika-labs-discord-launch/v1/social-cover.webp"
    }
  },
  "replit-agent": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/replit-agent/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "95e2c3d3bbbe4638eb0cc2f2de7f5f47d502fb3170267cd495cb633139c72803",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/replit-agent/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/replit-agent/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "89197db07410e4a95a9bd8ec66b0c3185ac2785c655bad65851f2f3feeec1fab",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/replit-agent/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/replit-agent/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "431c5303245907508a2cb15957a0f74976fee34b02c4d01ef46018ffb809f5b9",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/replit-agent/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/replit-agent/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "2de16bc1e7aef0d414567491210b42c4a763957d85ed8f645689e2d9d2952959",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/replit-agent/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/replit-agent/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "6e77abb6c13d45049a3a48598c410c4e8d027d86e9955588645c933742e6f52a",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/replit-agent/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/replit-agent/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "d8ec219d9695306639fbbc33f7d4c00d94eb11975ac6f7ee34a8d9aa88fdbf07",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/replit-agent/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/replit-agent/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "6e690b0f3be92ad7b9daed1d4e3d3b952ab4c4a95860a0f93cc9a2d90e3539e4",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/replit-agent/v1/social-cover.webp"
    }
  },
  "lex-page": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/lex-page/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "2b2b31ec86af7e672ddb647a921978fbdbeb4c43ccf5ff71409a1fbe84780f65",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/lex-page/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/lex-page/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "a4f030241328f0ed5ce5d74beab54fc9ea98965e4b25157a330acc104be121fd",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/lex-page/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/lex-page/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "61d781d072f56ec9b3b518be7e7cfa9e53f62746d8f22f7d1749301b04f3551b",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/lex-page/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/lex-page/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "fde28b03fe76cbc1be55de1b020ee6136d07d084be53657ffc0a37f34ffb0a44",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/lex-page/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/lex-page/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "4a9d85b4f3959a057e56c0939d022aefa692e29866fd19fd56b630549ee6e126",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/lex-page/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/lex-page/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "45802a0f4a2234a3ea4d4b7b9aa85f53a6aafe204ae8f99b6a7ac8bf8920cdab",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/lex-page/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/lex-page/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "d5a8c77d4fea7f8404aeae69316aed335bff502fbaddafed5c4ab33cbeceafc7",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/lex-page/v1/social-cover.webp"
    }
  },
  "signal": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/signal/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "46dc528100fe9ae99ed8fefe57fb11f0850275ecdb48e417fdd43bf448796e13",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/signal/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/signal/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "74894d14833b4b18c0bb27bed9c496d979997746a9ec508bd049443d3cef609d",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/signal/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/signal/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "d7fa72b7a3d8e0602f8d6ed03fc938f642af905c0ba3c0d5a908fa3851bf7af4",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/signal/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/signal/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "0a69ab414a9499abc00e5cd2774084b1148c9c8e1b829f41d5679d749d49e33f",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/signal/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/signal/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "64bb39da8c4c862a31854ef3eb589c5164d59c3081d9b9297d13c6a4c5eb0943",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/signal/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/signal/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "36dab1379aa22379679f37cb9e258951d013674045d95ef1df31a11c1072dc63",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/signal/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/signal/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "5be8e31534cda80ad0028ff47d40ebeca5600c1f088d68065f2a382e2085a716",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/signal/v1/social-cover.webp"
    }
  },
  "telegram-bot-platform": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/telegram-bot-platform/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "f446e4ae10c4964d5b1f8308293ddae9196cfc3a99523973c63bb8c9aa2c3fce",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/telegram-bot-platform/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/telegram-bot-platform/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "b04aeca326f88fe036448bd7db8df50ad88a14e03c5234113c39d628a92502a7",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/telegram-bot-platform/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/telegram-bot-platform/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "d48c3579f0120891ef492f02abc43e49d3beeb1e94f6875593b0cdfc7ea612ef",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/telegram-bot-platform/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/telegram-bot-platform/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "701afbe4b735acfd084528e3c5dea0713c4b0bbf449b821e94794fc20dc10938",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/telegram-bot-platform/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/telegram-bot-platform/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "2b02ffa59f77dd43f9e28f2eb4ab5ace80f3fb541f17b59e213158a0c161549b",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/telegram-bot-platform/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/telegram-bot-platform/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "82338c5ed1232f53cc096da13b23f40a92990f726593593793e5fc4bb3eb03fe",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/telegram-bot-platform/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/telegram-bot-platform/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "fbb381a1c79b6f1e96fb5cc82a16d2bbe2cd171acdd1d8e70f06c60a657dbd40",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/telegram-bot-platform/v1/social-cover.webp"
    }
  },
  "whatsapp-status": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/whatsapp-status/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "c5e50f7587f340c50cf452095e48b2f11931138fc472660258c97ab3b25b3169",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/whatsapp-status/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/whatsapp-status/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "4c11ef14b1ee6479b59ee4530f82b4e20f9079807e26e591905b3a777cb62ecf",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/whatsapp-status/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/whatsapp-status/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "76db52b86de674cf02f5bf2e06221bb7aa60bdac9b16ab6159063b3a21cadbe6",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/whatsapp-status/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/whatsapp-status/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "b3b7b33b326de55838d562b48622543eaf5e97655956225855638fa8948bd15a",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/whatsapp-status/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/whatsapp-status/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "1ee76c0699b5b6f3d114953e95a9e5d6ce021b0c628db175758ef2c278da51f4",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/whatsapp-status/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/whatsapp-status/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "03301ebdbe8f0116e13705ff0860d7d4a469431bdd88d29ba7f9b1bde62cce4c",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/whatsapp-status/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/whatsapp-status/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "c186656a457362a367c4741807873a63931c07160e3c3e39974190e5523cf752",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/whatsapp-status/v1/social-cover.webp"
    }
  },
  "craigslist-minimalism": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/craigslist-minimalism/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "d029718201e8a9a5783ccf6f07c9ce1c021317f21accfa68676e41e2e291fb9c",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/craigslist-minimalism/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/craigslist-minimalism/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "897fe606c68c1b55908cce6430e23ad77c47173fb31f0b1624f9df14317d8f27",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/craigslist-minimalism/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/craigslist-minimalism/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "0c3b03ff1e5418c54a640c0588b098dc0ed7060fbd45a53dcb5f4589f81a995a",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/craigslist-minimalism/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/craigslist-minimalism/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "4fa70ffb16d7b92995b2532f4e9e22250216874e578edd87ad13e29944874696",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/craigslist-minimalism/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/craigslist-minimalism/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "022fc6c7bd1cdd4c7340061a8862a1d98577a162d19724eca319f9ba826d8f19",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/craigslist-minimalism/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/craigslist-minimalism/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "8f198644a25782c81c3dd38dec207b5b320a18cfb1eeb0994341fde9631f0223",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/craigslist-minimalism/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/craigslist-minimalism/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "5dfe5cad8864fcfc70262025f1e5516be13ba120001eadf756bdab518ab48d7e",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/craigslist-minimalism/v1/social-cover.webp"
    }
  },
  "the-hustle": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/the-hustle/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "9ed50aaacae220bac4e552df4f05be83d1adb327020e395aed6c85b56772de33",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/the-hustle/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/the-hustle/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "76d0b2f13d5561f3ae8345daf7dfe07aeb8d2ed6e4ed8dc75f24c70b0c5fdbf7",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/the-hustle/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/the-hustle/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "f9aed24c4920eb8caf0cdf26ee457f4379eb6ff057b1d4777a84db3b54e00afe",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/the-hustle/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/the-hustle/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "318a384bc42b867cb7844c2f6157a5c5f1b6b9d5506778558c4ee543df246d13",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/the-hustle/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/the-hustle/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "5401af91c2b4045aed808498811b882f283242ba531419a64bb656c30fbd5c6c",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/the-hustle/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/the-hustle/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "b3204e289a74ce60bd0ac042bbdcde76b802c347473a5e9e23c8edebafd57798",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/the-hustle/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/the-hustle/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "c87450268b02b2270db921e613dba0cffb70f47f8e31ff884a90680a0724421c",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/the-hustle/v1/social-cover.webp"
    }
  },
  "shazam": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/shazam/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "863d7ed297d72742840e7de99a439a780f0c60a42f757ec789f22dd7fb117630",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/shazam/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/shazam/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "973eaef1f8d509573f4a9a0b59ef04e726575c121fc6e22aeaa965612be6d4bc",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/shazam/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/shazam/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "0b17af8a5eaf72f7f30bdbf3cfb11609a10f4387deca024f61b43e3fac500142",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/shazam/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/shazam/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "f6f72e1fe6c91c1b2ab56d6a74cc05401db3c9db5d9f85776629fee71475387b",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/shazam/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/shazam/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "403bf3096c3cc74f402a8a5f954c5894f505ac21a7b41a3a796c108ccff902db",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/shazam/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/shazam/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "7f7c778563746b86c03ce0d3dcea01a6c5b262b447f8faf0d626acec50420f27",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/shazam/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/shazam/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "4fc8b8053acfdf20fb56e5065dc97a9672bd3197219ad6d4e6cb0db57848d3de",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/shazam/v1/social-cover.webp"
    }
  },
  "twitter-140-char-limit": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/twitter-140-char-limit/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "bcffd7be6870b41e0d20dd3d615884f98388575ad4a20c35a47987a42cfd30ee",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/twitter-140-char-limit/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/twitter-140-char-limit/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "b8288baf0db73944c41a8b765eb5206d7b8da35a220e1a14b420b870c33091db",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/twitter-140-char-limit/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/twitter-140-char-limit/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "7cf8b2d57b914a64b0357cc807b2e3012ceb64a24307390f5391d70f51967f78",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/twitter-140-char-limit/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/twitter-140-char-limit/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "123ad49490e180ee75fa1b5d935969eba8a524076b70c21159191a2ae3d6e18f",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/twitter-140-char-limit/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/twitter-140-char-limit/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "2cd90aa72af3e499aa3df3ac3b335b4e6e6fe2dc2dc949f5b66765d42be7b96d",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/twitter-140-char-limit/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/twitter-140-char-limit/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "994c95a2140b219be2587bc1c3a7216c880cfa24f3a5b3bab3c23e71a24a2635",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/twitter-140-char-limit/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/twitter-140-char-limit/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "a50f257bef40bc815a687b2eefe06f00f3205e66c3c3d1ab26dc6938fd44d284",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/twitter-140-char-limit/v1/social-cover.webp"
    }
  },
  "dropbox-explainer-video": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/dropbox-explainer-video/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "d98c27ec19e328d679887b390d71f8d8957c8895a4a0444b0c9e37454387cdf9",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/dropbox-explainer-video/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/dropbox-explainer-video/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "1faa2e2bc5b73502361518bccdd9ee2fce0a2538d7d54d143167a6bd89a8bb8e",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/dropbox-explainer-video/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/dropbox-explainer-video/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "16a3bde192c960d1aaea1b36a999fae4a1f2241655c0b75d569227b2a048c6c3",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/dropbox-explainer-video/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/dropbox-explainer-video/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "d3cf528b32b5578f2b733fcb922f93641aa4e36b2dc4fb2fb0901bdefeb14649",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/dropbox-explainer-video/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/dropbox-explainer-video/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "5f03522100eafceec7f0f57b0edb96f6d3736bfc0cc528707264ee33e3b1d043",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/dropbox-explainer-video/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/dropbox-explainer-video/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "019a797cbdf14158eddd9080972f2208bc5a46cefbde33c8481cdde8b16e271f",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/dropbox-explainer-video/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/dropbox-explainer-video/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "957486abdde75c26b398383a8d9cad7db522e4997efff48ebd10d4530b614309",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/dropbox-explainer-video/v1/social-cover.webp"
    }
  },
  "paypal-ten-dollar-bonus": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/paypal-ten-dollar-bonus/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "818f843010438df0d068115d72cea6e555df3bb9803609f3118e3a3c3b8242d4",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/paypal-ten-dollar-bonus/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/paypal-ten-dollar-bonus/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "505b948b3c4193e7ce60b35158cbf44fd58f66d797ac31d966e33d943d1f7070",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/paypal-ten-dollar-bonus/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/paypal-ten-dollar-bonus/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "3e29267955d024fbed3fc924a7b77ed863270a60339f9b89e61c235463661d59",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/paypal-ten-dollar-bonus/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/paypal-ten-dollar-bonus/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "94cd5d120e9515225147003e3d60b2710ecf03f1d5cf735ca4cd2bd787e8b88e",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/paypal-ten-dollar-bonus/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/paypal-ten-dollar-bonus/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "d97c2dc3ad2aed622d493b360e189a7bcbc6d2e6cec85e774c56fd2c5be2cc52",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/paypal-ten-dollar-bonus/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/paypal-ten-dollar-bonus/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "9a00122a0ee8523180c86378454cc40811f71028919c72cb7a8abe7e65038fe4",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/paypal-ten-dollar-bonus/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/paypal-ten-dollar-bonus/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "fb6431adc6b1b16e3f54cad1b781e11cdc679bfa39a29ea9648953e71b602cc6",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/paypal-ten-dollar-bonus/v1/social-cover.webp"
    }
  },
  "slack-hn-launch": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/slack-hn-launch/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "4d8338c9c74bde70ed22e2fb9588ed45be08b8d79dc16c51b176e3ce213a2364",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/slack-hn-launch/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/slack-hn-launch/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "9bef0790364b48400bf7349c0167e0f7899d2cab0f1e6c283d3cff198ac057d5",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/slack-hn-launch/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/slack-hn-launch/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "af6e13cabc085148a518f8860fa68425e55765efb499143853a01c488811ca61",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/slack-hn-launch/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/slack-hn-launch/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "5ce96ad0b3293a5d240bd9086754adf5a53286edc67ae3a6f89f3c15a351be4b",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/slack-hn-launch/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/slack-hn-launch/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "3e8dcc0f5643500014ee8b9215e73f2aab174bc2f40e1c26144e6100995e3e53",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/slack-hn-launch/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/slack-hn-launch/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "4c04e8833581e1e00c4e6f20220ff0b2926cbe79486eaa1bd779a60e136fe522",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/slack-hn-launch/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/slack-hn-launch/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "a9eccd7a13b3e08ee8151ce517cc606f1d0e4cdcd98441247374512f06860b77",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/slack-hn-launch/v1/social-cover.webp"
    }
  },
  "figma-multiplayer-deep": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/figma-multiplayer-deep/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "aa4ceb8e9fb0a0a7aa0a81491c04871efdf475c5afa215a1338bb1d348b2fc0f",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/figma-multiplayer-deep/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/figma-multiplayer-deep/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "4d8d71ac6bd8458d87ca4499c2f846050158c276f530e365ad942370076d5f1b",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/figma-multiplayer-deep/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/figma-multiplayer-deep/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "20bc679d20395a126df551cb280a574115d68a9b4e77ae6254ff545bb707b0b2",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/figma-multiplayer-deep/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/figma-multiplayer-deep/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "a62c3afe28473f7d14ef7ec9a5809add7763a61fb1e770a0d4e8b8bdc55f22b4",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/figma-multiplayer-deep/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/figma-multiplayer-deep/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "959c3b2c298ceabd698f973d9989d0911a669ea44c7ebf13ea4049aa0b53f612",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/figma-multiplayer-deep/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/figma-multiplayer-deep/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "65a2e697df5a2579dc50e2917a3bd59c346bebd8d2f365c25382bdcfd3614491",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/figma-multiplayer-deep/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/figma-multiplayer-deep/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "d80faa27ad901cf50c54a93144012a967ee85af34da898f513833e103ecc4076",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/figma-multiplayer-deep/v1/social-cover.webp"
    }
  },
  "calm-mvp": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/calm-mvp/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "af93739f9ad2b5270763ed8afca8d95f3f4e30066bc56535305d0ec90ae7d624",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/calm-mvp/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/calm-mvp/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "b6a33ce401bcd44ac3ba88d8e1968c1dc35af3d4914ed34cf5a7181f7c594c5f",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/calm-mvp/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/calm-mvp/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "62e1d410c9f4a0ac641580ff8d379be5938c8812cfd4b7be8f3653d60eabb7c9",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/calm-mvp/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/calm-mvp/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "d4acc3702df4fb57cb444319101b7c92e0235225d2d5ed372e92bb4d5e49d59d",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/calm-mvp/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/calm-mvp/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "37e72b4a99ba41b91d90d755b81d6c4078063896db700fb976ab0b904781b64f",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/calm-mvp/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/calm-mvp/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "35ad4ba22135459dbab66c35276687039bfd199e6aa300f9b92da9767e30d5cc",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/calm-mvp/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/calm-mvp/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "246b589b9eb751daa74dad7bd08cde629b15604fbe13fed70b1c16af2c0fa230",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/calm-mvp/v1/social-cover.webp"
    }
  },
  "product-hunt-ship": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/product-hunt-ship/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "22e1de65cc4ea6705ed9c1d29dd6bb752f8691418a04ea1e4d3793d4ed21fc5b",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/product-hunt-ship/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/product-hunt-ship/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "f13325b1b47b87374e92f5db84fb130dbae682731115ac8af83cc1fc11e26739",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/product-hunt-ship/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/product-hunt-ship/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "378675039667b8b940c9ba1d1b48db9d95947d2696ad8bcc32b18fa197c6d17f",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/product-hunt-ship/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/product-hunt-ship/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "924dcae11f38e45843ea1efbb9b509b3b13eab51320daa2902d35179f92c2ec0",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/product-hunt-ship/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/product-hunt-ship/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "638a290088a1cb25ba5e33e3700ebab266b1a5d0a86905449f2992b5a0cdbdbe",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/product-hunt-ship/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/product-hunt-ship/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "c9a5f52d0bd2275cab8d14f8506f0018b82e32bfdfb3331200f4fc435fc49eba",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/product-hunt-ship/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/product-hunt-ship/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "f082ecddebe49a243660dfdfc483c872b9ecb80c76e46f3cf4b696bd52ed9644",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/product-hunt-ship/v1/social-cover.webp"
    }
  },
  "linear-why-we-switched": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/linear-why-we-switched/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "f20f60bca1d938940c32387c459432bd9b12d9179947ff7315d6017ecb327c06",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/linear-why-we-switched/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/linear-why-we-switched/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "461b934e22f891f4bc8dc13c0c17de49b454e99a730f9e3d8f26d890f6438077",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/linear-why-we-switched/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/linear-why-we-switched/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "01ce0db93804f79aed9b3f7df345cdd57af95405d24beecfd8d9a74f7c8454c1",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/linear-why-we-switched/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/linear-why-we-switched/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "a77f3c5795c285ed1cd884bc62db0aa1c98edffa4f2593f96b00d3baa22e0456",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/linear-why-we-switched/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/linear-why-we-switched/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "d73bf6a06c2cc0c45f1ccea0950544020b6ee8e733b2004dcd0652834074a3af",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/linear-why-we-switched/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/linear-why-we-switched/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "d82cf454bcaacf32986f74f4c3400f586a26f759e005915dac6077d094b26284",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/linear-why-we-switched/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/linear-why-we-switched/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "26202e713e3fe3d0895e5f99c4fd5c8ecad58024172c3ac84234a0a9d4576b1c",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/linear-why-we-switched/v1/social-cover.webp"
    }
  },
  "notion-template-gallery": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/notion-template-gallery/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "58abbc8db766877b725f746fee250a028c9cf672001ae10f4df808eafef3d4f9",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/notion-template-gallery/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/notion-template-gallery/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "9ec6ba4a1db129490d2081bdb49709aaed9d04ca7e5a2c27b77384c7e40b1ee0",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/notion-template-gallery/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/notion-template-gallery/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "2756ed7a1d9e71036d249808dcf8ccb2358607316e17e932ccbbe1f8bc4e9c2b",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/notion-template-gallery/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/notion-template-gallery/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "684499d283d5944dbd2413cb0bd454dc03467da86c29ac8d3a96cfae08d5a6ec",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/notion-template-gallery/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/notion-template-gallery/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "4382226526eb2aa7bd6e7a7f45c5ae49b038c0cbfe5e394480a878808efdcd4a",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/notion-template-gallery/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/notion-template-gallery/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "b4b4f8b3f04eee56cfb51c97ede1f0929ac98084ebb5dd7eaf1fe2cd28253936",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/notion-template-gallery/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/notion-template-gallery/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "66118151763ea2b7542f8801fa0c58a9ee31ba6619e0dfee804af2768658d659",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/notion-template-gallery/v1/social-cover.webp"
    }
  },
  "notion-no-offline-mode": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/notion-no-offline-mode/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "9248f4246cc8cc081df5b505dd71e9a4fd2946a5874ca80ed812fe22797a5950",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/notion-no-offline-mode/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/notion-no-offline-mode/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "7170868e1066d0c3f0c94e1be1cf23edadcb4206ded226e3a09a488baf98fc24",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/notion-no-offline-mode/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/notion-no-offline-mode/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "9f643132858dd5275e16ad9f2e9c75528c2d897aee3ab7204a8c94316a051f99",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/notion-no-offline-mode/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/notion-no-offline-mode/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "32c5e79f6938130f3f38f6102b3dd33f4339354958eddcea883e9eb2bcbf4a49",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/notion-no-offline-mode/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/notion-no-offline-mode/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "9f3b8ff7a752769124e015de458a0b52e611f3a9000f76104cb967b87401fc16",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/notion-no-offline-mode/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/notion-no-offline-mode/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "40a89c610c1f7194abc430b2815e38b9d5b67de32a613b2b32b60c915f7de192",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/notion-no-offline-mode/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/notion-no-offline-mode/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "a8afb3524b9add7e6e6eea2d951b6381e77d5ad4f01103ba30466d0b17a8c66b",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/notion-no-offline-mode/v1/social-cover.webp"
    }
  },
  "bear-notes": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/bear-notes/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "af4d90e41bae555f2d397afe6e260317077165750576babf83406236b09c78fc",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/bear-notes/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/bear-notes/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "f5b57c10e7b6aae79ea86e0bf88cfed76eecf0f080cb4b47913ba53fa61e636f",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/bear-notes/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/bear-notes/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "4b02044e557c37a6c201802783dcd0b3158938ec968f5c47457a595bd45e6e57",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/bear-notes/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/bear-notes/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "650fcb67dabe1eb2ef09afe889a0386733d78f08a8f95c8ae89f9ceb2eb21545",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/bear-notes/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/bear-notes/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "b5d25286708121f3188a21e14359d0de018687f20c8953b6930175dc6c9ae684",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/bear-notes/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/bear-notes/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "53464d5709fc633dd9f663d8873b384e5c959318d914a2d31dc7e896673d5d9c",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/bear-notes/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/bear-notes/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "adb57fcce3b708458e7086fe584aab8134d9f52f7aab52bb852c1820635856f9",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/bear-notes/v1/social-cover.webp"
    }
  },
  "wordle-clone-market": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/wordle-clone-market/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "8d55d7fcb7f00b1c18c537e38f49f52a7cfafb3189656618e61e89e32b2b998f",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/wordle-clone-market/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/wordle-clone-market/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "f613a8312e711197025270f530c81bec5ac529e4bbb24ae801bb87e4ce7eff6c",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/wordle-clone-market/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/wordle-clone-market/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "3a346efc90cf0ee5cf2eb1d7dd56a6b7cf8832395cbbf032e0b2f5774c6078aa",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/wordle-clone-market/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/wordle-clone-market/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "7763b644129ed7499d3efa9b92b88f5f0eb5948f0b0c48ed3f9eb13ee2d25fde",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/wordle-clone-market/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/wordle-clone-market/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "4c4770c1f7da33e8968db327a9c4032c6e0f4e48b4bf8de9d7efc394baa729b6",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/wordle-clone-market/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/wordle-clone-market/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "c9ccb8edc0e8fade04f2aff6f3206520070e94e6a409c497813d93e1f656610b",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/wordle-clone-market/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/wordle-clone-market/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "cf926ee231beb0012f04218ffb3094d09479cd5145dc41f2b6e4c01ee3b73884",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/wordle-clone-market/v1/social-cover.webp"
    }
  },
  "buffer": {
    "hero": {
      "bucket": "autopsy-images",
      "storagePath": "stories/buffer/v1/hero.webp",
      "storageVersion": "v1",
      "sha256": "8727d9e88ad55e7d6e18f2013b262a1464401c301599a236d48c4ff604bf0ff1",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/buffer/v1/hero.webp"
    },
    "hatch-narrator": {
      "bucket": "autopsy-images",
      "storagePath": "stories/buffer/v1/hatch-narrator.webp",
      "storageVersion": "v1",
      "sha256": "c149da56ab42b72dff7873c84c7b03471aa69dd66787373660bba51e785ee5d8",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/buffer/v1/hatch-narrator.webp"
    },
    "failure-mechanism": {
      "bucket": "autopsy-images",
      "storagePath": "stories/buffer/v1/failure-mechanism.webp",
      "storageVersion": "v1",
      "sha256": "ce4cb370f80e8157242e382f696217bb285c079dbcb46a72a07a6f797fe10cfc",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/buffer/v1/failure-mechanism.webp"
    },
    "evidence-card": {
      "bucket": "autopsy-images",
      "storagePath": "stories/buffer/v1/evidence-card.webp",
      "storageVersion": "v1",
      "sha256": "dfc5a7d374f669a1ea68f1e5bf57f77389293e24e3f49ff0a8ff504b4abdb07e",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/buffer/v1/evidence-card.webp"
    },
    "lesson-frame": {
      "bucket": "autopsy-images",
      "storagePath": "stories/buffer/v1/lesson-frame.webp",
      "storageVersion": "v1",
      "sha256": "ccd695f793a5b91232250afd6c469c0494637b0941eb7637b62afd9b68a90b6c",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/buffer/v1/lesson-frame.webp"
    },
    "thumbnail": {
      "bucket": "autopsy-images",
      "storagePath": "stories/buffer/v1/thumbnail.webp",
      "storageVersion": "v1",
      "sha256": "5395cba7b6f09e546191466306c683d7e0ed19065990a980fe29b7cf22f61fdb",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/buffer/v1/thumbnail.webp"
    },
    "social-cover": {
      "bucket": "autopsy-images",
      "storagePath": "stories/buffer/v1/social-cover.webp",
      "storageVersion": "v1",
      "sha256": "ff8e7cf7c69778b2bde5569506305d3df6fd795494bd2bf3c8bfd2507b836b85",
      "publicUrl": "https://tikkhvxlclivixqqqjyb.supabase.co/storage/v1/object/public/autopsy-images/stories/buffer/v1/social-cover.webp"
    }
  }
}
