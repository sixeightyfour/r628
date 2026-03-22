declare module "blit-to-screen.wgsl" {
  const data: {
  "bindGroups": [
    [
      {
        "name": "samp",
        "type": {
          "name": "sampler",
          "attributes": [
            {
              "id": 620,
              "line": 10,
              "name": "group",
              "value": "0"
            },
            {
              "id": 621,
              "line": 10,
              "name": "binding",
              "value": "0"
            }
          ],
          "size": 0,
          "format": null,
          "access": null
        },
        "group": 0,
        "binding": 0,
        "attributes": [
          {
            "id": 620,
            "line": 10,
            "name": "group",
            "value": "0"
          },
          {
            "id": 621,
            "line": 10,
            "name": "binding",
            "value": "0"
          }
        ],
        "resourceType": 3,
        "access": ""
      },
      {
        "name": "tex",
        "type": {
          "name": "texture_2d_array",
          "attributes": [
            {
              "id": 624,
              "line": 11,
              "name": "group",
              "value": "0"
            },
            {
              "id": 625,
              "line": 11,
              "name": "binding",
              "value": "1"
            }
          ],
          "size": 0,
          "format": {
            "name": "f32",
            "attributes": null,
            "size": 4
          },
          "access": null
        },
        "group": 0,
        "binding": 1,
        "attributes": [
          {
            "id": 624,
            "line": 11,
            "name": "group",
            "value": "0"
          },
          {
            "id": 625,
            "line": 11,
            "name": "binding",
            "value": "1"
          }
        ],
        "resourceType": 2,
        "access": "read"
      }
    ]
  ]
};
 export default data; 
}