using Microsoft.Owin;
using Owin;

[assembly: OwinStartupAttribute(typeof(EmbedAPI.Startup))]
namespace EmbedAPI
{
    public partial class Startup
    {
        public void Configuration(IAppBuilder app)
        {
            ConfigureAuth(app);
        }
    }
}
