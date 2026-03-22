declare module "compute.wgsl" {
  const data: {
  "bindGroups": [
    [
      {
        "name": "tex",
        "type": {
          "name": "texture_storage_2d_array",
          "attributes": [
            {
              "id": 214,
              "line": 17,
              "name": "group",
              "value": "0"
            },
            {
              "id": 215,
              "line": 17,
              "name": "binding",
              "value": "0"
            }
          ],
          "size": 0,
          "format": {
            "name": "rgba32float",
            "attributes": null,
            "size": 0
          },
          "access": "write"
        },
        "group": 0,
        "binding": 0,
        "attributes": [
          {
            "id": 214,
            "line": 17,
            "name": "group",
            "value": "0"
          },
          {
            "id": 215,
            "line": 17,
            "name": "binding",
            "value": "0"
          }
        ],
        "resourceType": 4,
        "access": "read"
      },
      {
        "name": "prevTex",
        "type": {
          "name": "texture_storage_2d_array",
          "attributes": [
            {
              "id": 218,
              "line": 18,
              "name": "group",
              "value": "0"
            },
            {
              "id": 219,
              "line": 18,
              "name": "binding",
              "value": "1"
            }
          ],
          "size": 0,
          "format": {
            "name": "rgba32float",
            "attributes": null,
            "size": 0
          },
          "access": "read"
        },
        "group": 0,
        "binding": 1,
        "attributes": [
          {
            "id": 218,
            "line": 18,
            "name": "group",
            "value": "0"
          },
          {
            "id": 219,
            "line": 18,
            "name": "binding",
            "value": "1"
          }
        ],
        "resourceType": 4,
        "access": "read"
      }
    ],
    [
      {
        "name": "params",
        "type": {
          "name": "Params",
          "attributes": null,
          "size": 288,
          "members": [
            {
              "name": "size",
              "type": {
                "name": "vec2",
                "attributes": null,
                "size": 8,
                "format": {
                  "name": "u32",
                  "attributes": null,
                  "size": 4
                },
                "access": null
              },
              "attributes": null,
              "offset": 0,
              "size": 8
            },
            {
              "name": "rand",
              "type": {
                "name": "vec2f",
                "attributes": null,
                "size": 8
              },
              "attributes": null,
              "offset": 8,
              "size": 8
            },
            {
              "name": "transform",
              "type": {
                "name": "mat4x4f",
                "attributes": null,
                "size": 64
              },
              "attributes": null,
              "offset": 16,
              "size": 64
            },
            {
              "name": "transformInv",
              "type": {
                "name": "mat4x4f",
                "attributes": null,
                "size": 64
              },
              "attributes": null,
              "offset": 80,
              "size": 64
            },
            {
              "name": "lastTransformInverse",
              "type": {
                "name": "mat4x4f",
                "attributes": null,
                "size": 64
              },
              "attributes": null,
              "offset": 144,
              "size": 64
            },
            {
              "name": "lastTransform",
              "type": {
                "name": "mat4x4f",
                "attributes": null,
                "size": 64
              },
              "attributes": null,
              "offset": 208,
              "size": 64
            },
            {
              "name": "brightnessFactor",
              "type": {
                "name": "f32",
                "attributes": null,
                "size": 4
              },
              "attributes": null,
              "offset": 272,
              "size": 4
            },
            {
              "name": "shouldReset",
              "type": {
                "name": "u32",
                "attributes": null,
                "size": 4
              },
              "attributes": null,
              "offset": 276,
              "size": 4
            },
            {
              "name": "aspect",
              "type": {
                "name": "f32",
                "attributes": null,
                "size": 4
              },
              "attributes": null,
              "offset": 280,
              "size": 4
            }
          ],
          "align": 16,
          "startLine": 5,
          "endLine": 15,
          "inUse": true
        },
        "group": 1,
        "binding": 0,
        "attributes": [
          {
            "id": 222,
            "line": 20,
            "name": "group",
            "value": "1"
          },
          {
            "id": 223,
            "line": 20,
            "name": "binding",
            "value": "0"
          }
        ],
        "resourceType": 0,
        "access": "read"
      }
    ]
  ]
};
 export default data; 
}