// 模型配置数据 - 避免运行时文件系统访问
export const modelConfigs = {
  keyboard: {
    "Version": 3,
    "FileReferences": {
      "Moc": "demomodel2.moc3",
      "Textures": [
        "demomodel2.1024/texture_00.png",
        "demomodel2.1024/texture_01.png",
        "demomodel2.1024/texture_02.png"
      ],
      "DisplayInfo": "demomodel2.cdi3.json",
      "Expressions": [
        {
          "Name": "默认喵",
          "File": "live2d_expression0.exp3.json"
        },
        {
          "Name": "社会喵",
          "File": "live2d_expression1.exp3.json"
        },
        {
          "Name": "天使喵",
          "File": "live2d_expression2.exp3.json"
        }
      ],
      "Motions": {
        "CAT_motion": [
          {
            "Name": "雷霆喵",
            "File": "live2d_motion1.motion3.json",
            "Sound": "live2d_motion1.flac",
            "FadeInTime": 0,
            "FadeOutTime": 0
          },
          {
            "Name": "摇摆喵",
            "File": "live2d_motion2.motion3.json",
            "FadeInTime": 0,
            "FadeOutTime": 0
          }
        ]
      }
    },
    "Groups": [
      {
        "Target": "Parameter",
        "Name": "EyeBlink",
        "Ids": [
          "ParamEyeLOpen",
          "ParamEyeROpen"
        ]
      },
      {
        "Target": "Parameter",
        "Name": "LipSync",
        "Ids": []
      }
    ]
  },
  
  standard: {
    "Version": 3,
    "FileReferences": {
      "Moc": "demomodel2.moc3",
      "Textures": [
        "demomodel2.1024/texture_00.png"
      ],
      "Physics": "demomodel2.physics3.json",
      "UserData": "demomodel2.userdata3.json", 
      "DisplayInfo": "demomodel2.cdi3.json"
    },
    "Groups": [
      {
        "Target": "Parameter",
        "Name": "LipSync", 
        "Ids": ["ParamMouthOpenY"]
      },
      {
        "Target": "Parameter",
        "Name": "EyeBlink",
        "Ids": ["ParamEyeLOpen", "ParamEyeROpen"]
      }
    ],
    "HitAreas": [
      {
        "Name": "Head",
        "Id": "HitArea"
      }
    ],
    "Motions": {
      "Idle": [
        {
          "File": "live2d_motion1.motion3.json",
          "Sound": "live2d_motion1.flac",
          "FadeInTime": 0.5,
          "FadeOutTime": 0.5
        }
      ]
    },
    "Expressions": [
      {
        "Name": "f01",
        "File": "exp_1.exp3.json"
      }
    ]
  }
} 